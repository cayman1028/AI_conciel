import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// レート制限の実装
const rateLimit = {
  windowMs: 60 * 1000, // 1分
  max: 10 // 最大リクエスト数
};

const rateLimitMap = new Map();

export async function POST(req: Request) {
  try {
    // リクエスト元のIPアドレスを取得
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    // レート制限のチェック
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];
    const recentRequests = userRequests.filter(time => now - time < rateLimit.windowMs);
    
    if (recentRequests.length >= rateLimit.max) {
      return NextResponse.json(
        { error: 'レート制限を超過しました。しばらく待ってから再試行してください。' },
        { status: 429 }
      );
    }
    
    // リクエストを記録
    rateLimitMap.set(ip, [...recentRequests, now]);

    // リクエストボディの取得
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '無効なリクエスト形式です。' },
        { status: 400 }
      );
    }

    // OpenAI APIクライアントの初期化
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY // NEXT_PUBLIC_ プレフィックスを削除
    });

    // OpenAI APIへのリクエスト
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'あなたは親切で丁寧な日本語を話すAIアシスタントです。' },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return NextResponse.json(response.choices[0].message);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    );
  }
} 