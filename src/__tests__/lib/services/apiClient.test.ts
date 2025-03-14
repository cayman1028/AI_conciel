import {
    ApiClient,
    FetchApiClient,
    MockApiClient,
    getApiClient,
    setApiClient
} from '../../../lib/services/apiClient';

describe('ApiClient', () => {
  // 元のfetch関数を保存
  const originalFetch = global.fetch;
  
  // 各テスト後にfetchをリセット
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });
  
  describe('FetchApiClient', () => {
    let client: ApiClient;
    
    beforeEach(() => {
      client = new FetchApiClient();
    });
    
    it('POSTリクエストを正しく送信できること', async () => {
      // fetchのモック
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ success: true }),
        status: 200,
        headers: new Headers(),
        ok: true,
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const result = await client.post('/api/test', { data: 'test' });
      
      // fetchが正しく呼ばれたか確認
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ data: 'test' }),
        })
      );
      
      // 結果が正しいか確認
      expect(result).toEqual({
        data: { success: true },
        status: 200,
        headers: mockResponse.headers,
        ok: true,
      });
    });
    
    it('GETリクエストを正しく送信できること', async () => {
      // fetchのモック
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ success: true }),
        status: 200,
        headers: new Headers(),
        ok: true,
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const result = await client.get('/api/test');
      
      // fetchが正しく呼ばれたか確認
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      
      // 結果が正しいか確認
      expect(result).toEqual({
        data: { success: true },
        status: 200,
        headers: mockResponse.headers,
        ok: true,
      });
    });
    
    it('ストリーミングPOSTリクエストを正しく送信できること', async () => {
      // fetchのモック
      const mockResponse = {
        status: 200,
        headers: new Headers(),
        ok: true,
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const result = await client.postStream('/api/stream', { data: 'test' });
      
      // fetchが正しく呼ばれたか確認
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stream',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({ data: 'test' }),
        })
      );
      
      // 結果が正しいか確認
      expect(result).toBe(mockResponse);
    });
    
    it('カスタムヘッダーを設定できること', async () => {
      // fetchのモック
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ success: true }),
        status: 200,
        headers: new Headers(),
        ok: true,
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      await client.post('/api/test', { data: 'test' }, {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });
      
      // カスタムヘッダーが設定されているか確認
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });
    
    it('タイムアウトが正しく機能すること', async () => {
      // setTimeoutのモック
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout');

      // AbortControllerのモック
      const mockAbort = jest.fn();
      const mockController = {
        signal: 'mock-signal',
        abort: mockAbort,
      };
      
      // @ts-ignore
      global.AbortController = jest.fn().mockImplementation(() => mockController);
      
      // fetchのモック
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ success: true }),
        status: 200,
        headers: new Headers(),
        ok: true,
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      // タイムアウトを設定
      const promise = client.post('/api/test', { data: 'test' }, {
        timeout: 1000,
      });
      
      // AbortControllerが作成されたか確認
      expect(global.AbortController).toHaveBeenCalled();
      
      // fetchにsignalが渡されたか確認
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          signal: 'mock-signal',
        })
      );
      
      // タイムアウトが設定されたか確認
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);

      // タイマーを進める
      jest.runAllTimers();
      
      await promise;
      
      // 実時間に戻す
      jest.useRealTimers();
    });
  });
  
  describe('MockApiClient', () => {
    let client: MockApiClient;
    
    beforeEach(() => {
      client = new MockApiClient();
    });
    
    it('モックレスポンスを設定して取得できること', async () => {
      // モックレスポンスを設定
      client.setMockResponse('/api/test', { success: true }, 200);
      
      // リクエストを送信
      const result = await client.post('/api/test', { data: 'test' });
      
      // 結果が正しいか確認
      expect(result).toEqual({
        data: { success: true },
        status: 200,
        headers: expect.any(Headers),
        ok: true,
      });
    });
    
    it('モックストリームレスポンスを設定して取得できること', async () => {
      // モックレスポンスを作成
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // モックレスポンスを設定
      client.setMockStreamResponse('/api/stream', mockResponse);
      
      // リクエストを送信
      const result = await client.postStream('/api/stream', { data: 'test' });
      
      // 結果が正しいか確認
      expect(result).toBe(mockResponse);
    });
    
    it('設定されていないURLに対してデフォルトレスポンスを返すこと', async () => {
      // リクエストを送信
      const result = await client.post('/api/unknown', { data: 'test' });
      
      // デフォルトレスポンスが返されるか確認
      expect(result).toEqual({
        data: {},
        status: 200,
        headers: expect.any(Headers),
        ok: true,
      });
    });
  });
  
  describe('getApiClient', () => {
    it('デフォルトでFetchApiClientを返すこと', () => {
      const client = getApiClient();
      expect(client).toBeInstanceOf(FetchApiClient);
    });
    
    it('同じインスタンスを返すこと', () => {
      const client1 = getApiClient();
      const client2 = getApiClient();
      expect(client1).toBe(client2);
    });
  });
  
  describe('setApiClient', () => {
    it('カスタムAPIクライアントを設定できること', () => {
      const mockClient = new MockApiClient();
      setApiClient(mockClient);
      
      const client = getApiClient();
      expect(client).toBe(mockClient);
    });
  });
}); 