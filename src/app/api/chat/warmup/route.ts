import { NextRequest, NextResponse } from 'next/server';
import { getWarmupStatus, warmupOpenAI } from '../../../../lib/services/openaiService';

export async function POST(req: NextRequest) {
  try {
    // すでにウォームアップ済みの場合は早期リターン
    if (getWarmupStatus()) {
      return NextResponse.json({ success: true, message: 'すでにウォームアップ済みです' });
    }
    
    // OpenAI接続をプリウォーミング
    await warmupOpenAI();
    
    return NextResponse.json({ success: true, message: 'ウォームアップが完了しました' });
  } catch (error) {
    console.error('OpenAI接続のプリウォーミングに失敗しました:', error);
    return NextResponse.json(
      { success: false, error: 'ウォームアップに失敗しました' },
      { status: 500 }
    );
  }
} 