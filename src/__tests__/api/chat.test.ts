/**
 * Chat APIのテスト
 * MSWを使用してAPIリクエストをモック
 */

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
