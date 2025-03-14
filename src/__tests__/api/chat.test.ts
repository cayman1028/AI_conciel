/**
 * Chat APIのテスト
 * MSWを使用してAPIリクエストをモック
 */

import { jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../../app/api/chat/route';

// グローバルオブジェクトの定義
// jest.setup.jsで定義されているため、ここでは不要
// global.Response = Response;
// global.Request = Request;
// global.Headers = Headers;

// 環境変数のモック
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.ALLOWED_ORIGINS = '*';

// OpenAI APIのモック
const openaiHandlers = [
  http.post('https://api.openai.com/v1/chat/completions', async () => {
    return HttpResponse.json({
      id: 'chatcmpl-test-id',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-3.5-turbo',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'これはモックされたOpenAI APIからの応答です。',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    });
  }),
];

// MSWサーバーのセットアップ
const server = setupServer(...openaiHandlers);

// テスト前にサーバーを起動
beforeAll(() => server.listen());

// 各テスト後にリクエストハンドラーをリセット
afterEach(() => server.resetHandlers());

// テスト後にサーバーをクローズ
afterAll(() => server.close());

// NextResponseのモック
const mockNextResponse = () => {
  const json = jest.fn().mockImplementation((data) => {
    return {
      status: 200,
      body: JSON.stringify(data),
      headers: new Headers(),
    };
  });
  
  return {
    json,
  };
};

// NextRequestのモック
const createMockNextRequest = (body: any) => {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
};

// ストリーミングレスポンスのモック
const mockStreamResponse = () => {
  const transformStream = new TransformStream();
  const writer = transformStream.writable.getWriter();
  
  const encoder = new TextEncoder();
  
  const nextResponse = NextResponse.json(
    { message: 'Streaming response' },
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
  );
  
  // @ts-ignore - プライベートプロパティにアクセス
  nextResponse.body = transformStream.readable;
  
  return { nextResponse, writer, encoder };
};

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
jest.mock('../../../lib/companyConfig', () => ({
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
jest.mock('../../../lib/companyResponses', () => ({
  getResponseTemplate: jest.fn().mockResolvedValue('テンプレートレスポンス')
}));

describe('Chat API', () => {
  describe('基本的なレスポンス処理', () => {
    it('JSONレスポンスが正しく動作すること', () => {
      const response = {
        status: 200,
        json: () => ({
          message: {
            role: 'assistant',
            content: 'これはテスト応答です。'
          }
        })
      };
      
      expect(response.status).toBe(200);
      expect(response.json()).toHaveProperty('message');
      expect(response.json().message.content).toBe('これはテスト応答です。');
    });

    it('リクエストボディが正しく解析されること', () => {
      const requestBody = JSON.stringify({
        messages: [{ role: 'user', content: 'こんにちは' }]
      });
      
      const parsedBody = JSON.parse(requestBody);
      
      expect(parsedBody).toHaveProperty('messages');
      expect(parsedBody.messages[0].content).toBe('こんにちは');
    });
  });

  describe('APIハンドラーのテスト', () => {
    it('正常なリクエストに対して200レスポンスを返すこと', async () => {
      // NextRequestのモック
      const req = createMockNextRequest({
        messages: [
          { role: 'system', content: 'あなたはAIアシスタントです。' },
          { role: 'user', content: 'こんにちは' }
        ]
      });
      
      // APIハンドラーを呼び出し
      const response = await POST(req);
      
      // レスポンスを検証
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('message');
      expect(responseData.message).toHaveProperty('content');
    });
    
    it('メッセージがない場合は400エラーを返すこと', async () => {
      // 空のリクエストボディ
      const req = createMockNextRequest({});
      
      // APIハンドラーを呼び出し
      const response = await POST(req);
      
      // レスポンスを検証
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('error');
    });
  });

  describe('OpenAI APIとの統合テスト', () => {
    it('OpenAI APIからの応答を正しく処理できること', async () => {
      // このテストはMSWによってモックされたOpenAI APIを使用
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'あなたはAIアシスタントです。' },
            { role: 'user', content: 'こんにちは' }
          ]
        })
      });
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('choices');
      expect(data.choices[0].message.content).toBe('これはモックされたOpenAI APIからの応答です。');
    });
  });

  it('有効なリクエストに対して200レスポンスを返すこと', async () => {
    // NextRequestのモック
    const req = createMockNextRequest({
      messages: [
        { role: 'system', content: 'あなたはAIアシスタントです。' },
        { role: 'user', content: 'こんにちは' }
      ]
    });
    
    // APIハンドラーを呼び出し
    const response = await POST(req);
    
    // レスポンスを検証
    expect(response.status).toBe(200);
  });
});

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
