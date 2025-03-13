import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// レート制限のための変数
const ipRateLimits = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10');
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分

// トピック抽出のためのプロンプト
const TOPIC_EXTRACTION_PROMPT = `
あなたはユーザーとの会話からトピックを抽出するAIです。
以下の会話から主要なトピックを3-5個抽出し、単語または短いフレーズでリストアップしてください。
トピックは日本語で、カンマ区切りの配列形式で出力してください。
例: ["旅行", "食事", "趣味"]

会話:
`;

export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: 'レート制限を超えました。しばらく待ってから再試行してください。' },
        { status: 429 }
      );
    }
    
    limit.count++;
    
    // リクエストボディの解析
    const body = await req.json();
    
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: '無効なリクエスト形式です。messagesフィールドが必要です。' },
        { status: 400 }
      );
    }
    
    // メッセージの設定
    const messages = [...body.messages];
    const userContext = body.userContext || '';
    
    // システムメッセージの処理
    const baseSystemPrompt = 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。時間帯に応じて適切な挨拶をしてください。朝（5時〜12時）は「おはようございます」、昼（12時〜17時）は「こんにちは」、夕方・夜（17時〜22時）は「こんばんは」、深夜（22時〜5時）は「お疲れ様です」と挨拶してください。';
    
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
    
    // OpenAI APIへのリクエスト
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
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
        const topicResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
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
      topics: topics
    });
    
  } catch (error: any) {
    console.error('Error in chat API:', error);
    
    return NextResponse.json(
      { error: `エラーが発生しました: ${error.message}` },
      { status: 500 }
    );
  }
} 