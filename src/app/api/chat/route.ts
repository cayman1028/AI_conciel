import { getCompanyConfig } from '@/lib/companyConfig';
import { getResponseTemplate } from '@/lib/companyResponses';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// レート制限のための変数
const ipRateLimits = new Map<string, { count: number, resetTime: number }>();

// メモリキャッシュ（高速化のため）
const promptCache = new Map<string, string>();
const responseCache = new Map<string, { response: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分間キャッシュを保持

// プリウォーミング用のフラグ（サーバー起動時に一度だけOpenAI接続を初期化）
let isWarmedUp = false;

// プリコンパイルされたプロンプト（初期化時に一度だけ処理）
const TOPIC_EXTRACTION_PROMPT = `
あなたはユーザーとの会話からトピックを抽出するAIです。
以下の会話から主要なトピックを3-5個抽出し、単語または短いフレーズでリストアップしてください。
トピックは日本語で、カンマ区切りの配列形式で出力してください。
例: ["旅行", "食事", "趣味"]

会話:
`;

// あいまい表現検出のためのプロンプト
const AMBIGUOUS_EXPRESSION_PROMPT = `
あなたは日本語の婉曲表現やあいまい表現を検出し解釈するAIです。
以下のユーザーの発言から、日本語特有のあいまい表現、婉曲表現、遠回しな表現を検出し、その真意を解釈してください。
会話の文脈や前後の発言、トピックを考慮して解釈してください。

検出すべき表現の例:
- 「ちょっと」「少し」（控えめな表現で実際は「とても」の意味かもしれない）
- 「もしよかったら」「できれば」（実際には強い要望かもしれない）
- 「～かもしれません」「～と思います」（確信があるが控えめに表現している）
- 「検討します」「難しいかもしれません」（断りの婉曲表現）
- 「そうですね」（同意ではなく考え中や曖昧な返事）
- 「すみません」（謝罪ではなく感謝や注意喚起の意味）
- 「よろしければ」「お手すきの際に」（実際には早急な対応を期待している）
- 「気にしないでください」（実際には気にしている）
- 「大丈夫です」（実際には問題がある可能性）

文脈に応じた解釈の例:
- ビジネス文脈での「検討します」は多くの場合「実現は難しい」という意味
- 顧客からの「ちょっと高いですね」は「値下げしてほしい」という要望かもしれない
- 上司への「可能であれば」は「強く希望する」という意味かもしれない

JSON形式で以下の情報を返してください:
{
  "detected": true/false,  // あいまい表現が検出されたかどうか
  "expression": "検出された表現",  // 検出された表現（なければ空文字）
  "interpretation": "解釈された真意",  // 表現の解釈（なければ空文字）
  "confidence": 0-1,  // 解釈の確信度（0.0〜1.0）
  "context_factors": ["考慮した文脈要素1", "考慮した文脈要素2"]  // 解釈に影響を与えた文脈要素
}

会話の文脈:
{{CONVERSATION_CONTEXT}}

ユーザーの発言:
`;

// 初期レスポンス用のプロンプト（高速応答のため）
const INITIAL_RESPONSE_PROMPT = `
あなたはユーザーの質問に対して、まず最初に短い応答を返し、その後詳細な回答を続けるAIアシスタントです。
最初の応答は1-2文の短い文で、ユーザーの質問に対する直接的な答えや、これから詳しく説明することを伝える内容にしてください。
例えば「はい、それは可能です。詳細を説明します。」「ご質問ありがとうございます。その点について解説します。」などです。
`;

// あいまい表現を含む可能性が高い表現のパターン（高速フィルタリング用）
const AMBIGUOUS_PATTERNS = [
  'ちょっと', '少し', 'もしよかったら', 'できれば', 'かもしれません', 'と思います',
  '検討', '難しい', 'そうですね', 'すみません', 'よろしければ', 'お手すき',
  '気にしないで', '大丈夫です', 'いいんじゃないですか', 'どうでしょうか'
];

// ストリーミングレスポンスのエンコーダー
const encoder = new TextEncoder();
function createEncoder() {
  return (chunk: string) => encoder.encode(chunk);
}

// ストリーミングレスポンスを作成する関数
function createStreamResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}

// メッセージのハッシュ値を計算する関数（キャッシュキーとして使用）
function computeMessageHash(messages: any[]): string {
  // 単純化のため、JSON文字列化してハッシュ代わりに使用
  return JSON.stringify(messages.map(m => ({
    role: m.role,
    content: m.content
  })));
}

// キャッシュの有効期限をチェックして古いエントリを削除
function cleanupCache() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  responseCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => {
    responseCache.delete(key);
  });
}

// 最適化: 会話の長さに基づいてトピック抽出が必要かどうかを判断
function shouldExtractTopics(messages: any[], responseLength: number): boolean {
  // 会話が短い場合や応答が短い場合はスキップ
  if (messages.length < 3 || responseLength < 100) {
    return false;
  }
  
  // ユーザーメッセージが少ない場合もスキップ
  const userMessages = messages.filter(msg => msg.role === 'user');
  if (userMessages.length < 2) {
    return false;
  }
  
  return true;
}

// OpenAIクライアントのシングルトンインスタンス
let openaiClient: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// サーバー起動時にOpenAI接続をプリウォーミング
async function warmupOpenAI() {
  if (isWarmedUp) return;
  
  try {
    const openai = getOpenAIClient();
    
    // 軽量なリクエストを送信して接続を初期化
    await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
      temperature: 0.0,
    });
    
    isWarmedUp = true;
    console.log('OpenAI接続のプリウォーミングが完了しました');
  } catch (error) {
    console.error('OpenAI接続のプリウォーミングに失敗しました:', error);
  }
}

// サーバー起動時にプリウォーミングを実行
warmupOpenAI();

export async function POST(req: NextRequest) {
  try {
    // 定期的にキャッシュをクリーンアップ
    cleanupCache();
    
    // リクエストボディの解析
    const body = await req.json();
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: '無効なリクエスト形式です。messagesフィールドが必要です。' },
        { status: 400 }
      );
    }
    
    // ストリーミングモードの確認
    const streamMode = body.stream === true;
    
    // 法人IDの取得（リクエストから取得、なければデフォルト）
    const companyId = body.companyId || 'default';
    
    // 法人設定の取得（非同期処理を開始）
    const companyConfigPromise = getCompanyConfig(companyId);
    
    // メッセージの設定（コピーして変更可能にする）
    const messages = [...body.messages];
    const userContext = body.userContext || '';
    
    // 最新のユーザーメッセージを取得（あいまい表現検出のため）
    const latestUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop();
    
    // 法人設定が取得できるまで他の処理を並行して実行
    const companyConfig = await companyConfigPromise;
    
    // レート制限の設定を法人設定から取得
    const RATE_LIMIT_MAX = companyConfig.rateLimit?.maxRequests || 10;
    const RATE_LIMIT_WINDOW_MS = companyConfig.rateLimit?.windowMs || 60 * 1000; // 1分
    
    // レート制限のチェック
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    
    if (!ipRateLimits.has(ip)) {
      ipRateLimits.set(ip, { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS });
    }
    
    const limit = ipRateLimits.get(ip)!;
    
    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + RATE_LIMIT_WINDOW_MS;
    }
    
    if (limit.count >= RATE_LIMIT_MAX) {
      // 法人固有のレート制限エラーメッセージを取得
      const rateLimitErrorMessage = await getResponseTemplate(
        companyId,
        'errors',
        'rateLimit',
        'リクエストが多すぎます。しばらく待ってから再試行してください。'
      );
      
      return NextResponse.json(
        { error: rateLimitErrorMessage },
        { status: 429 }
      );
    }
    
    limit.count++;
    
    // システムメッセージの処理
    // 法人固有のシステムプロンプトを使用
    const baseSystemPrompt = companyConfig.systemPrompt || 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。';
    
    // ユーザーコンテキストがある場合は追加
    const systemPrompt = userContext 
      ? `${baseSystemPrompt}\n\n${userContext}`
      : baseSystemPrompt;
    
    // システムメッセージが含まれている場合は置き換え、なければ追加
    const systemMessageIndex = messages.findIndex(msg => msg.role === 'system');
    if (systemMessageIndex >= 0) {
      // 既存のシステムメッセージを更新
      messages[systemMessageIndex] = {
        role: 'system',
        content: systemPrompt
      };
    } else {
      // システムメッセージを追加
      messages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }
    
    // OpenAI APIの初期化（シングルトンパターン）
    const openai = getOpenAIClient();
    
    // あいまい表現の検出と解釈
    let ambiguousExpression = {
      detected: false,
      expression: '',
      interpretation: '',
      confidence: 0,
      context_factors: []
    };
    
    // キャッシュチェック（ストリーミングモードでない場合のみ）
    if (!streamMode) {
      const messageHash = computeMessageHash(messages);
      const cachedResponse = responseCache.get(messageHash);
      
      if (cachedResponse) {
        // キャッシュされた応答を返す
        return NextResponse.json({
          message: cachedResponse.response.message,
          topics: cachedResponse.response.topics,
          ambiguousExpression: ambiguousExpression.detected ? ambiguousExpression : null,
          fromCache: true
        });
      }
    }
    
    // あいまい表現の検出処理（重要度が低い場合は非同期で実行）
    let ambiguousExpressionPromise: Promise<any> | null = null;
    
    if (latestUserMessage && messages.length >= 3) {
      ambiguousExpressionPromise = (async () => {
        try {
          // 会話の文脈を構築（直近の最大5つのメッセージ）
          const conversationContext = messages
            .filter(msg => msg.role !== 'system')
            .slice(-5)
            .map(msg => `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`)
            .join('\n');
          
          // プロンプトに文脈情報を埋め込む
          const contextualPrompt = AMBIGUOUS_EXPRESSION_PROMPT.replace(
            '{{CONVERSATION_CONTEXT}}',
            conversationContext
          );
          
          // 法人設定からモデル設定を取得
          const ambiguousExpressionModel = companyConfig.apiSettings?.ambiguousExpressionModel || 'gpt-4o';
          
          const ambiguousResponse = await openai.chat.completions.create({
            model: ambiguousExpressionModel,
            messages: [
              { role: 'system', content: contextualPrompt },
              { role: 'user', content: latestUserMessage.content }
            ],
            temperature: 0.3,
            max_tokens: 250,
            response_format: { type: 'json_object' }
          });
          
          const ambiguousContent = ambiguousResponse.choices[0].message.content || '';
          try {
            const parsedResult = JSON.parse(ambiguousContent);
            return {
              detected: parsedResult.detected || false,
              expression: parsedResult.expression || '',
              interpretation: parsedResult.interpretation || '',
              confidence: parsedResult.confidence || 0,
              context_factors: parsedResult.context_factors || []
            };
          } catch (e) {
            console.error('あいまい表現解析エラー:', e);
            return ambiguousExpression;
          }
        } catch (e) {
          console.error('あいまい表現検出APIエラー:', e);
          return ambiguousExpression;
        }
      })();
    }
    
    // あいまい表現の検出結果を待機（必要な場合のみ）
    if (ambiguousExpressionPromise) {
      const result = await ambiguousExpressionPromise;
      ambiguousExpression = result;
      
      // あいまい表現が検出された場合、システムプロンプトに追加情報を付与
      if (ambiguousExpression.detected && ambiguousExpression.confidence >= 0.6 && systemMessageIndex >= 0) {
        messages[systemMessageIndex].content += `\n\n【検出されたあいまい表現】\n「${ambiguousExpression.expression}」という表現が検出されました。これは「${ambiguousExpression.interpretation}」という意図である可能性があります（確信度: ${Math.round(ambiguousExpression.confidence * 100)}%）。\n考慮された文脈要素: ${ambiguousExpression.context_factors.join('、')}\nこの解釈を考慮して応答してください。`;
      }
    }
    
    // 法人設定からモデル設定を取得
    const chatModel = companyConfig.apiSettings?.chatModel || 'gpt-3.5-turbo';
    const temperature = companyConfig.apiSettings?.temperature || 0.7;
    const maxTokens = companyConfig.apiSettings?.maxTokens || 1000;
    
    // ストリーミングモードの場合
    if (streamMode) {
      // ReadableStreamを使用してストリーミングレスポンスを作成
      const stream = new ReadableStream({
        async start(controller) {
          const encode = createEncoder();
          
          // トピック抽出のための変数
          let fullResponse = '';
          let topics: string[] = [];
          
          try {
            // 初期レスポンスを高速化するためのメッセージ準備
            const initialMessages = [...messages];
            
            // 初期レスポンス用のシステムメッセージを追加
            if (initialMessages[0].role === 'system') {
              initialMessages[0].content = INITIAL_RESPONSE_PROMPT + '\n\n' + initialMessages[0].content;
            } else {
              initialMessages.unshift({
                role: 'system',
                content: INITIAL_RESPONSE_PROMPT
              });
            }
            
            // 初期レスポンスと完全なレスポンスを並行して取得
            const initialResponsePromise = openai.chat.completions.create({
              model: 'gpt-3.5-turbo', // 初期レスポンスには高速なモデルを使用
              messages: initialMessages,
              temperature: 0.3, // 低い温度で一貫性のある応答を生成
              max_tokens: 60, // 短い応答のみ
              presence_penalty: 0.6, // 新しい内容を促進
            });
            
            // 完全なレスポンスのストリーミングリクエスト
            const fullResponsePromise = openai.chat.completions.create({
              model: chatModel,
              messages: messages,
              temperature: temperature,
              max_tokens: maxTokens,
              stream: true,
            });
            
            // 並行処理を開始
            const [initialResponse, fullResponseStream] = await Promise.all([
              initialResponsePromise,
              fullResponsePromise
            ]);
            
            // 初期レスポンスを即座に送信
            const initialContent = initialResponse.choices[0].message.content || '';
            if (initialContent) {
              fullResponse += initialContent;
              const dataChunk = JSON.stringify({ 
                type: 'chunk', 
                content: initialContent
              });
              controller.enqueue(encode(`data: ${dataChunk}\n\n`));
            }
            
            // ストリーミングレスポンスを処理
            for await (const chunk of fullResponseStream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                // レスポンスを蓄積
                fullResponse += content;
                
                // チャンクをクライアントに送信
                const dataChunk = JSON.stringify({ 
                  type: 'chunk', 
                  content 
                });
                controller.enqueue(encode(`data: ${dataChunk}\n\n`));
              }
            }
            
            // トピック抽出処理（バックグラウンドで実行）
            let topicExtractionPromise: Promise<string[]> | null = null;
            
            if (shouldExtractTopics(messages, fullResponse.length)) {
              topicExtractionPromise = (async () => {
                try {
                  // 最近のメッセージを取得
                  const recentMessages = messages
                    .filter(msg => msg.role !== 'system')
                    .slice(-5)
                    .map(msg => `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`)
                    .join('\n');
                  
                  // 最新の応答を含めたメッセージ
                  const messagesWithResponse = `${recentMessages}\nアシスタント: ${fullResponse}`;
                  
                  // 法人設定からトピック抽出モデルを取得
                  const topicExtractionModel = companyConfig.apiSettings?.topicExtractionModel || 'gpt-3.5-turbo';
                  
                  const topicResponse = await openai.chat.completions.create({
                    model: topicExtractionModel,
                    messages: [
                      { role: 'system', content: TOPIC_EXTRACTION_PROMPT },
                      { role: 'user', content: messagesWithResponse }
                    ],
                    temperature: 0.3,
                    max_tokens: 100,
                  });
                  
                  const topicContent = topicResponse.choices[0].message.content || '';
                  // トピックの抽出（JSON形式の配列を想定）
                  try {
                    // 文字列からJSON配列を抽出
                    const match = topicContent.match(/\[.*\]/);
                    if (match) {
                      return JSON.parse(match[0]);
                    }
                  } catch (e) {
                    console.error('トピック抽出エラー:', e);
                  }
                  return [];
                } catch (e) {
                  console.error('トピック抽出APIエラー:', e);
                  return [];
                }
              })();
            }
            
            // 完了メッセージを送信（トピック抽出を待たずに）
            const completionData = JSON.stringify({ 
              type: 'complete', 
              message: { role: 'assistant', content: fullResponse },
              topics: [] // 初期値は空配列
            });
            controller.enqueue(encode(`data: ${completionData}\n\n`));
            
            // トピック抽出が完了したら追加情報を送信
            if (topicExtractionPromise) {
              topics = await topicExtractionPromise;
              if (topics.length > 0) {
                const topicsData = JSON.stringify({
                  type: 'topics',
                  topics
                });
                controller.enqueue(encode(`data: ${topicsData}\n\n`));
              }
            }
            
            // レスポンスをキャッシュに保存（バックグラウンドで）
            const messageHash = computeMessageHash(messages);
            const responseData = {
              message: { role: 'assistant', content: fullResponse },
              topics
            };
            responseCache.set(messageHash, { response: responseData, timestamp: Date.now() });
            
          } catch (error) {
            // エラー処理
            const errorData = JSON.stringify({ 
              type: 'error', 
              error: 'エラーが発生しました。もう一度お試しください。' 
            });
            controller.enqueue(encode(`data: ${errorData}\n\n`));
            console.error('ストリーミングエラー:', error);
          } finally {
            // ストリームを閉じる
            controller.close();
          }
        }
      });
      
      // ストリーミングレスポンスを返す
      return createStreamResponse(stream);
    } 
    // 通常モード（ストリーミングなし）
    else {
      // OpenAI APIへのリクエスト
      const response = await openai.chat.completions.create({
        model: chatModel,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      });
      
      // 会話からトピックを抽出（最後の5つのメッセージを使用）
      let topics: string[] = [];
      
      // 最適化: メッセージが少ない場合やシンプルな会話ではスキップ
      if (shouldExtractTopics(messages, (response.choices[0].message.content || '').length)) {
        const recentMessages = messages
          .filter(msg => msg.role !== 'system')
          .slice(-5)
          .map(msg => `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`)
          .join('\n');
        
        try {
          // 法人設定からトピック抽出モデルを取得
          const topicExtractionModel = companyConfig.apiSettings?.topicExtractionModel || 'gpt-3.5-turbo';
          
          const topicResponse = await openai.chat.completions.create({
            model: topicExtractionModel,
            messages: [
              { role: 'system', content: TOPIC_EXTRACTION_PROMPT },
              { role: 'user', content: recentMessages }
            ],
            temperature: 0.3,
            max_tokens: 100,
          });
          
          const topicContent = topicResponse.choices[0].message.content || '';
          // トピックの抽出（JSON形式の配列を想定）
          try {
            // 文字列からJSON配列を抽出
            const match = topicContent.match(/\[.*\]/);
            if (match) {
              topics = JSON.parse(match[0]);
            }
          } catch (e) {
            console.error('トピック抽出エラー:', e);
          }
        } catch (e) {
          console.error('トピック抽出APIエラー:', e);
        }
      }
      
      // レスポンスをキャッシュに保存
      const messageHash = computeMessageHash(messages);
      const responseData = {
        message: response.choices[0].message,
        topics
      };
      responseCache.set(messageHash, { response: responseData, timestamp: Date.now() });
      
      // レスポンスの返却
      return NextResponse.json({
        message: response.choices[0].message,
        topics,
        ambiguousExpression: ambiguousExpression.detected ? ambiguousExpression : null
      });
    }
  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    );
  }
} 