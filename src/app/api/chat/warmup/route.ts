import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

// プリウォーミング用のフラグ
let isWarmedUp = false;

export async function POST(req: NextRequest) {
  try {
    // すでにウォームアップ済みの場合は早期リターン
    if (isWarmedUp) {
      return NextResponse.json({ success: true, message: 'すでにウォームアップ済みです' });
    }
    
    // OpenAIクライアントの初期化
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
    
    return NextResponse.json({ success: true, message: 'ウォームアップが完了しました' });
  } catch (error) {
    console.error('OpenAI接続のプリウォーミングに失敗しました:', error);
    return NextResponse.json(
      { success: false, error: 'ウォームアップに失敗しました' },
      { status: 500 }
    );
  }
} 