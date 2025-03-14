/**
 * APIクライアントのインターフェース
 * fetchなどのHTTPリクエストAPIを抽象化
 */
export interface ApiClient {
  /**
   * POSTリクエストを送信
   * @param url リクエスト先のURL
   * @param data リクエストボディのデータ
   * @param options リクエストオプション
   * @returns レスポンスのPromise
   */
  post<T = any>(url: string, data: any, options?: RequestOptions): Promise<ApiResponse<T>>;
  
  /**
   * GETリクエストを送信
   * @param url リクエスト先のURL
   * @param options リクエストオプション
   * @returns レスポンスのPromise
   */
  get<T = any>(url: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  
  /**
   * ストリーミングPOSTリクエストを送信
   * @param url リクエスト先のURL
   * @param data リクエストボディのデータ
   * @param options リクエストオプション
   * @returns レスポンスのPromise
   */
  postStream(url: string, data: any, options?: RequestOptions): Promise<Response>;
}

/**
 * リクエストオプションの型定義
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  priority?: 'high' | 'low' | 'auto';
}

/**
 * APIレスポンスの型定義
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
  ok: boolean;
}

/**
 * fetchを使用したAPIクライアントの実装
 */
export class FetchApiClient implements ApiClient {
  /**
   * POSTリクエストを送信
   * @param url リクエスト先のURL
   * @param data リクエストボディのデータ
   * @param options リクエストオプション
   * @returns レスポンスのPromise
   */
  async post<T = any>(url: string, data: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { headers = {}, timeout = 30000, signal, priority } = options;
    
    // タイムアウト処理
    const controller = signal ? undefined : new AbortController();
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : undefined;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
        signal: signal || (controller ? controller.signal : undefined),
        priority: priority as any,
      });
      
      const responseData = await response.json();
      
      return {
        data: responseData,
        status: response.status,
        headers: response.headers,
        ok: response.ok,
      };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
  
  /**
   * GETリクエストを送信
   * @param url リクエスト先のURL
   * @param options リクエストオプション
   * @returns レスポンスのPromise
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const { headers = {}, timeout = 30000, signal, priority } = options;
    
    // タイムアウト処理
    const controller = signal ? undefined : new AbortController();
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : undefined;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: signal || (controller ? controller.signal : undefined),
        priority: priority as any,
      });
      
      const responseData = await response.json();
      
      return {
        data: responseData,
        status: response.status,
        headers: response.headers,
        ok: response.ok,
      };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
  
  /**
   * ストリーミングPOSTリクエストを送信
   * @param url リクエスト先のURL
   * @param data リクエストボディのデータ
   * @param options リクエストオプション
   * @returns レスポンスのPromise
   */
  async postStream(url: string, data: any, options: RequestOptions = {}): Promise<Response> {
    const { headers = {}, timeout = 30000, signal, priority } = options;
    
    // タイムアウト処理
    const controller = signal ? undefined : new AbortController();
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : undefined;
    
    try {
      return await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
        signal: signal || (controller ? controller.signal : undefined),
        priority: priority as any,
      });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}

/**
 * モック用APIクライアントの実装
 */
export class MockApiClient implements ApiClient {
  private mockResponses: Record<string, any> = {};
  private mockStreamResponses: Record<string, Response> = {};
  
  /**
   * モックレスポンスを設定
   * @param url リクエスト先のURL
   * @param data レスポンスデータ
   * @param status ステータスコード
   */
  setMockResponse(url: string, data: any, status: number = 200): void {
    this.mockResponses[url] = {
      data,
      status,
      ok: status >= 200 && status < 300,
    };
  }
  
  /**
   * ストリーミングモックレスポンスを設定
   * @param url リクエスト先のURL
   * @param response レスポンスオブジェクト
   */
  setMockStreamResponse(url: string, response: Response): void {
    this.mockStreamResponses[url] = response;
  }
  
  /**
   * POSTリクエストを送信
   * @param url リクエスト先のURL
   * @param data リクエストボディのデータ
   * @param options リクエストオプション
   * @returns レスポンスのPromise
   */
  async post<T = any>(url: string, data: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const mockResponse = this.mockResponses[url] || {
      data: {},
      status: 200,
      ok: true,
    };
    
    return {
      ...mockResponse,
      headers: new Headers(),
    };
  }
  
  /**
   * GETリクエストを送信
   * @param url リクエスト先のURL
   * @param options リクエストオプション
   * @returns レスポンスのPromise
   */
  async get<T = any>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const mockResponse = this.mockResponses[url] || {
      data: {},
      status: 200,
      ok: true,
    };
    
    return {
      ...mockResponse,
      headers: new Headers(),
    };
  }
  
  /**
   * ストリーミングPOSTリクエストを送信
   * @param url リクエスト先のURL
   * @param data リクエストボディのデータ
   * @param options リクエストオプション
   * @returns レスポンスのPromise
   */
  async postStream(url: string, data: any, options: RequestOptions = {}): Promise<Response> {
    return this.mockStreamResponses[url] || new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// デフォルトのAPIクライアントインスタンス
let defaultApiClient: ApiClient;

/**
 * デフォルトのAPIクライアントを取得
 */
export function getApiClient(): ApiClient {
  if (!defaultApiClient) {
    defaultApiClient = new FetchApiClient();
  }
  return defaultApiClient;
}

/**
 * テスト用にAPIクライアントを設定
 * @param client 設定するAPIクライアント
 */
export function setApiClient(client: ApiClient): void {
  defaultApiClient = client;
} 