import { getCompanyConfig } from '@/lib/companyConfig';
import { getResponseTemplate } from '@/lib/companyResponses';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// レート制限のための変数
const ipRateLimits = new Map<string, { count: number, resetTime: number }>();

// トピック抽出のためのプロンプト
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

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの解析
    const body = await req.json();
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: '無効なリクエスト形式です。messagesフィールドが必要です。' },
        { status: 400 }
      );
    }
    
    // 法人IDの取得（リクエストから取得、なければデフォルト）
    const companyId = body.companyId || 'default';
    
    // 法人設定の取得
    const companyConfig = await getCompanyConfig(companyId);
    
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
    
    // メッセージの設定
    const messages = [...body.messages];
    const userContext = body.userContext || '';
    
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
    
    // OpenAI APIの初期化
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // 最新のユーザーメッセージを取得
    const latestUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop();
    
    // あいまい表現の検出と解釈
    let ambiguousExpression = {
      detected: false,
      expression: '',
      interpretation: '',
      confidence: 0,
      context_factors: []
    };
    
    if (latestUserMessage) {
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
          ambiguousExpression = {
            detected: parsedResult.detected || false,
            expression: parsedResult.expression || '',
            interpretation: parsedResult.interpretation || '',
            confidence: parsedResult.confidence || 0,
            context_factors: parsedResult.context_factors || []
          };
          
          // あいまい表現が検出された場合、システムプロンプトに追加情報を付与
          if (ambiguousExpression.detected && ambiguousExpression.confidence >= 0.6 && systemMessageIndex >= 0) {
            messages[systemMessageIndex].content += `\n\n【検出されたあいまい表現】\n「${ambiguousExpression.expression}」という表現が検出されました。これは「${ambiguousExpression.interpretation}」という意図である可能性があります（確信度: ${Math.round(ambiguousExpression.confidence * 100)}%）。\n考慮された文脈要素: ${ambiguousExpression.context_factors.join('、')}\nこの解釈を考慮して応答してください。`;
          }
        } catch (e) {
          console.error('あいまい表現解析エラー:', e);
        }
      } catch (e) {
        console.error('あいまい表現検出APIエラー:', e);
      }
    }
    
    // 法人設定からモデル設定を取得
    const chatModel = companyConfig.apiSettings?.chatModel || 'gpt-3.5-turbo';
    const temperature = companyConfig.apiSettings?.temperature || 0.7;
    const maxTokens = companyConfig.apiSettings?.maxTokens || 1000;
    
    // OpenAI APIへのリクエスト
    const response = await openai.chat.completions.create({
      model: chatModel,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    });
    
    // 会話からトピックを抽出（最後の5つのメッセージを使用）
    let topics: string[] = [];
    if (messages.length >= 3) {
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
          // エラーが発生した場合は空の配列を使用
          topics = [];
        }
      } catch (e) {
        console.error('トピック抽出APIエラー:', e);
      }
    }
    
    // レスポンスの返却
    return NextResponse.json({
      message: response.choices[0].message,
      usage: response.usage,
      topics: topics,
      ambiguousExpression: ambiguousExpression,
      companyId: companyId  // レスポンスに法人IDを含める
    });
    
  } catch (error: any) {
    console.error('Error in chat API:', error);
    
    return NextResponse.json(
      { error: `エラーが発生しました: ${error.message}` },
      { status: 500 }
    );
  }
} 