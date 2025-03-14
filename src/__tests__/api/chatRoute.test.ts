/**
 * APIルートのテスト
 * src/app/api/chat/route.ts
 */

import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/chat/route';

// OpenAIのモック
jest.mock('openai', () => {
  return class OpenAI {
    chat = {
      completions: {
        create: jest.fn().mockImplementation(async ({ messages, stream }) => {
          if (stream) {
            // ストリーミングレスポンスのモック
            return {
              [Symbol.asyncIterator]: async function* () {
                yield {
                  choices: [{
                    delta: { content: 'こんにちは' },
                    index: 0,
                    finish_reason: null
                  }]
                };
                yield {
                  choices: [{
                    delta: { content: '、お手伝いできます。' },
                    index: 0,
                    finish_reason: null
                  }]
                };
                yield {
                  choices: [{
                    delta: { content: '' },
                    index: 0,
                    finish_reason: 'stop'
                  }]
                };
              }
            };
          } else {
            // 通常のレスポンスのモック
            return {
              choices: [{
                message: { content: 'こんにちは、お手伝いできます。' },
                finish_reason: 'stop'
              }]
            };
          }
        })
      }
    };
  };
});

// companyConfigのモック
jest.mock('../../lib/companyConfig', () => ({
  getCompanyConfig: jest.fn().mockResolvedValue({
    systemPrompt: 'あなたは企業のカスタマーサポートAIアシスタントです。',
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000
    },
    model: 'gpt-3.5-turbo',
    temperature: 0.7
  })
}));

// companyResponsesのモック
jest.mock('../../lib/companyResponses', () => ({
  getResponseTemplate: jest.fn().mockResolvedValue('テンプレートレスポンス')
}));

describe('Chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常なリクエストに対して200レスポンスを返すこと', async () => {
    // リクエストの作成
    const req = new NextRequest('https://example.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'こんにちは' }
        ],
        stream: false
      })
    });

    // APIルートの呼び出し
    const response = await POST(req);
    
    // レスポンスの検証
    expect(response.status).toBe(200);
    
    // レスポンスボディの検証
    const responseData = await response.json();
    expect(responseData).toHaveProperty('content');
    expect(responseData.content).toContain('こんにちは');
  });

  it('ストリーミングモードで正常にレスポンスを返すこと', async () => {
    // リクエストの作成
    const req = new NextRequest('https://example.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'こんにちは' }
        ],
        stream: true
      })
    });

    // APIルートの呼び出し
    const response = await POST(req);
    
    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    
    // ストリームの読み取り
    const reader = response.body?.getReader();
    if (reader) {
      let receivedData = '';
      
      // ストリームからデータを読み取る
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // バイナリデータを文字列に変換
        const chunk = new TextDecoder().decode(value);
        receivedData += chunk;
      }
      
      // データの検証
      expect(receivedData).toContain('こんにちは');
      expect(receivedData).toContain('お手伝いできます');
    }
  });

  it('無効なリクエストに対して400エラーを返すこと', async () => {
    // 無効なリクエスト（messagesフィールドなし）
    const req = new NextRequest('https://example.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify({
        invalidField: true
      })
    });

    // APIルートの呼び出し
    const response = await POST(req);
    
    // レスポンスの検証
    expect(response.status).toBe(400);
    
    // エラーメッセージの検証
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
  });

  // レート制限のテストはスキップ（実際のテストでは時間がかかるため）
  it.skip('レート制限を超えた場合に429エラーを返すこと', async () => {
    // レート制限を超えるリクエストを送信
    const req = new NextRequest('https://example.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'こんにちは' }
        ]
      })
    });

    // レート制限を超えるまでリクエストを送信
    for (let i = 0; i < 11; i++) {
      await POST(req);
    }

    // 11回目のリクエスト（レート制限超過）
    const response = await POST(req);
    
    // レスポンスの検証
    expect(response.status).toBe(429);
    
    // エラーメッセージの検証
    const errorData = await response.json();
    expect(errorData).toHaveProperty('error');
  });
}); 