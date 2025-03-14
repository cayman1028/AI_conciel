/**
 * テストヘルパー関数
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserContext } from '../../lib/userContext';

/**
 * テスト用のモックユーザーコンテキストを作成する
 * @param overrides 上書きするプロパティ
 * @returns モックユーザーコンテキスト
 */
export function createMockUserContext(overrides: Partial<UserContext> = {}): UserContext {
  return {
    preferences: {},
    recentQuestions: [],
    topics: {},
    ambiguousExpressions: [],
    ...overrides
  };
}

/**
 * テスト用のモックメッセージを作成する
 * @param role メッセージの役割（user, assistant, system）
 * @param content メッセージの内容
 * @returns モックメッセージ
 */
export function createMockMessage(role: 'user' | 'assistant' | 'system', content: string) {
  return { role, content };
}

/**
 * テスト用のモック会話履歴を作成する
 * @param messageCount 生成するメッセージの数
 * @returns モック会話履歴
 */
export function createMockConversation(messageCount: number = 4) {
  const messages = [];
  
  // システムメッセージを追加
  messages.push(createMockMessage('system', 'あなたは企業のカスタマーサポートAIアシスタントです。'));
  
  // 交互にユーザーとアシスタントのメッセージを追加
  for (let i = 0; i < messageCount; i++) {
    if (i % 2 === 0) {
      messages.push(createMockMessage('user', `これはテストメッセージ ${i + 1} です。`));
    } else {
      messages.push(createMockMessage('assistant', `テストメッセージ ${i} への回答です。`));
    }
  }
  
  return messages;
}

/**
 * localStorageをモックする
 * @returns モックlocalStorageとリセット関数
 */
export function mockLocalStorage() {
  let store: Record<string, string> = {};
  
  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
  
  const resetStorage = () => {
    store = {};
    jest.clearAllMocks();
  };
  
  return { mockStorage, resetStorage };
}

/**
 * fetchをモックする
 * @param responseData レスポンスデータ
 * @param status ステータスコード
 * @returns モックfetch関数
 */
export function mockFetch(responseData: any, status: number = 200) {
  return jest.fn().mockImplementation(() => 
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(responseData),
      text: () => Promise.resolve(JSON.stringify(responseData)),
    })
  );
}

/**
 * テスト用のモックストリームレスポンスを作成する
 * @param chunks 返すチャンク（文字列の配列）
 * @returns モックストリームレスポンス
 */
export function createMockStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    start(controller) {
      let chunkIndex = 0;
      
      function pushNextChunk() {
        if (chunkIndex < chunks.length) {
          controller.enqueue(encoder.encode(chunks[chunkIndex]));
          chunkIndex++;
          setTimeout(pushNextChunk, 10);
        } else {
          controller.close();
        }
      }
      
      pushNextChunk();
    }
  });
}

/**
 * テスト用のモックNextRequestを作成する
 * @param url リクエストURL
 * @param method HTTPメソッド
 * @param body リクエストボディ
 * @param headers リクエストヘッダー
 * @returns モックNextRequest
 */
export function createMockNextRequest(
  url: string = 'https://example.com',
  method: string = 'GET',
  body: any = null,
  headers: Record<string, string> = {}
) {
  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : null
  });
}

/**
 * テスト用のモックNextResponseを作成する
 * @param data レスポンスデータ
 * @param status ステータスコード
 * @param headers レスポンスヘッダー
 * @returns モックNextResponse
 */
export function createMockNextResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
) {
  return NextResponse.json(data, {
    status,
    headers
  });
}

/**
 * テスト用のタイマーをモックする
 */
export function mockTimers() {
  jest.useFakeTimers();
  
  return {
    advanceTimersByTime: (ms: number) => jest.advanceTimersByTime(ms),
    runAllTimers: () => jest.runAllTimers(),
    restoreTimers: () => jest.useRealTimers()
  };
}

/**
 * テスト用のコンソールをモックする
 */
export function mockConsole() {
  const originalConsole = { ...console };
  
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.info = jest.fn();
  
  return {
    restoreConsole: () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
      console.info = originalConsole.info;
    }
  };
} 