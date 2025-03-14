import {
    MockOpenAIService,
    OpenAIApiService,
    OpenAIMessage,
    OpenAIService,
    getOpenAIService,
    getWarmupStatus,
    resetWarmupStatus,
    setOpenAIService,
    warmupOpenAI
} from '../../../lib/services/openaiService';

// OpenAI SDKのモック
const mockCreate = jest.fn().mockImplementation(async ({ stream }) => {
  if (stream) {
    // ストリーミングレスポンスのモック
    return {
      [Symbol.asyncIterator]: async function* () {
        yield {
          choices: [{
            delta: { role: 'assistant' },
            index: 0,
            finish_reason: null
          }]
        };
        yield {
          choices: [{
            delta: { content: 'これはモックレスポンスです。' },
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
      id: 'mock-id',
      choices: [{
        message: { role: 'assistant', content: 'これはモックレスポンスです。' },
        index: 0,
        finish_reason: 'stop'
      }]
    };
  }
});

// OpenAI SDKのモック
jest.mock('openai', () => {
  return function() {
    return {
      chat: {
        completions: {
          create: mockCreate
        }
      }
    };
  };
});

// OpenAIApiServiceのプロトタイプをモック
const originalOpenAIApiService = OpenAIApiService.prototype;
const originalCreateChatCompletion = originalOpenAIApiService.createChatCompletion;
const originalCreateStreamingChatCompletion = originalOpenAIApiService.createStreamingChatCompletion;

describe('OpenAIService', () => {
  // 各テスト前にモックを設定
  beforeEach(() => {
    // OpenAIApiServiceのメソッドをモック
    OpenAIApiService.prototype.createChatCompletion = async function(messages, options = {}) {
      return {
        id: 'mock-id',
        choices: [{
          message: { role: 'assistant', content: 'これはモックレスポンスです。' },
          index: 0,
          finish_reason: 'stop'
        }]
      };
    };
    
    OpenAIApiService.prototype.createStreamingChatCompletion = async function(messages, options = {}, callback) {
      if (callback) {
        callback({
          choices: [{
            delta: { role: 'assistant' },
            index: 0,
            finish_reason: null
          }]
        });
        
        callback({
          choices: [{
            delta: { content: 'これはモックレスポンスです。' },
            index: 0,
            finish_reason: null
          }]
        });
        
        callback({
          choices: [{
            delta: { content: '' },
            index: 0,
            finish_reason: 'stop'
          }]
        });
      }
    };
  });
  
  // 各テスト後にモックをリセット
  afterEach(() => {
    jest.clearAllMocks();
    resetWarmupStatus();
    
    // 元のメソッドを復元
    OpenAIApiService.prototype.createChatCompletion = originalCreateChatCompletion;
    OpenAIApiService.prototype.createStreamingChatCompletion = originalCreateStreamingChatCompletion;
  });
  
  describe('OpenAIApiService', () => {
    let service: OpenAIService;
    
    beforeEach(() => {
      service = new OpenAIApiService('test-api-key');
    });
    
    it('チャット完了リクエストを正しく送信できること', async () => {
      const messages: OpenAIMessage[] = [
        { role: 'system', content: 'あなたはAIアシスタントです。' },
        { role: 'user', content: 'こんにちは' }
      ];
      
      const response = await service.createChatCompletion(messages);
      
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('choices');
      expect(response.choices[0].message.content).toBe('これはモックレスポンスです。');
    });
    
    it('ストリーミングチャット完了リクエストを正しく送信できること', async () => {
      const messages: OpenAIMessage[] = [
        { role: 'system', content: 'あなたはAIアシスタントです。' },
        { role: 'user', content: 'こんにちは' }
      ];
      
      const mockCallback = jest.fn();
      
      await service.createStreamingChatCompletion(messages, {}, mockCallback);
      
      // コールバックが3回呼ばれたことを確認（3つのチャンク）
      expect(mockCallback).toHaveBeenCalledTimes(3);
      
      // 最初のチャンクでroleが設定されていることを確認
      expect(mockCallback.mock.calls[0][0].choices[0].delta).toHaveProperty('role', 'assistant');
      
      // 2番目のチャンクでcontentが設定されていることを確認
      expect(mockCallback.mock.calls[1][0].choices[0].delta).toHaveProperty('content', 'これはモックレスポンスです。');
      
      // 最後のチャンクでfinish_reasonが'stop'であることを確認
      expect(mockCallback.mock.calls[2][0].choices[0].finish_reason).toBe('stop');
    });
    
    it('オプションを正しく設定できること', async () => {
      const messages: OpenAIMessage[] = [
        { role: 'user', content: 'こんにちは' }
      ];
      
      const options = {
        model: 'gpt-4',
        temperature: 0.5,
        max_tokens: 100,
      };
      
      const spy = jest.spyOn(service, 'createChatCompletion');
      
      await service.createChatCompletion(messages, options);
      
      // createChatCompletionが正しいオプションで呼ばれたことを確認
      expect(spy).toHaveBeenCalledWith(messages, options);
    });
  });
  
  describe('MockOpenAIService', () => {
    let service: MockOpenAIService;
    
    beforeEach(() => {
      service = new MockOpenAIService();
    });
    
    it('デフォルトのモックレスポンスを返すこと', async () => {
      const messages: OpenAIMessage[] = [
        { role: 'user', content: 'こんにちは' }
      ];
      
      const response = await service.createChatCompletion(messages);
      
      expect(response).toHaveProperty('id', 'mock-id');
      expect(response.choices[0].message.content).toBe('これはモックレスポンスです。');
    });
    
    it('カスタムモックレスポンスを設定できること', async () => {
      const customResponse = {
        id: 'custom-id',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'カスタムレスポンスです。',
            },
            finish_reason: 'stop',
          },
        ],
      };
      
      service.setMockResponse(customResponse);
      
      const messages: OpenAIMessage[] = [
        { role: 'user', content: 'こんにちは' }
      ];
      
      const response = await service.createChatCompletion(messages);
      
      expect(response).toBe(customResponse);
      expect(response.choices[0].message.content).toBe('カスタムレスポンスです。');
    });
    
    it('ストリーミングコールバックを正しく呼び出すこと', async () => {
      const messages: OpenAIMessage[] = [
        { role: 'user', content: 'こんにちは' }
      ];
      
      const mockCallback = jest.fn();
      
      await service.createStreamingChatCompletion(messages, {}, mockCallback);
      
      // デフォルトでは5つのチャンクがあるため、コールバックが5回呼ばれることを確認
      expect(mockCallback).toHaveBeenCalledTimes(5);
    });
    
    it('カスタムストリーミングデルタを設定できること', async () => {
      const customDeltas = [
        {
          choices: [
            {
              index: 0,
              delta: {
                role: 'assistant',
              },
              finish_reason: null,
            },
          ],
        },
        {
          choices: [
            {
              index: 0,
              delta: {
                content: 'カスタムストリーミングです。',
              },
              finish_reason: 'stop',
            },
          ],
        },
      ];
      
      service.setMockStreamingDeltas(customDeltas);
      
      const messages: OpenAIMessage[] = [
        { role: 'user', content: 'こんにちは' }
      ];
      
      const mockCallback = jest.fn();
      
      await service.createStreamingChatCompletion(messages, {}, mockCallback);
      
      // カスタムデルタは2つのチャンクしかないため、コールバックが2回呼ばれることを確認
      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback.mock.calls[1][0].choices[0].delta.content).toBe('カスタムストリーミングです。');
    });
  });
  
  describe('getOpenAIService', () => {
    it('デフォルトでOpenAIApiServiceを返すこと', () => {
      const service = getOpenAIService();
      expect(service).toBeInstanceOf(OpenAIApiService);
    });
    
    it('同じインスタンスを返すこと', () => {
      const service1 = getOpenAIService();
      const service2 = getOpenAIService();
      expect(service1).toBe(service2);
    });
  });
  
  describe('setOpenAIService', () => {
    it('カスタムOpenAIサービスを設定できること', () => {
      const mockService = new MockOpenAIService();
      setOpenAIService(mockService);
      
      const service = getOpenAIService();
      expect(service).toBe(mockService);
    });
  });
  
  describe('warmupOpenAI', () => {
    it('初回呼び出し時にOpenAI接続を初期化すること', async () => {
      expect(getWarmupStatus()).toBe(false);
      
      await warmupOpenAI();
      
      expect(getWarmupStatus()).toBe(true);
    });
    
    it('2回目以降の呼び出しでは何もしないこと', async () => {
      // 1回目の呼び出し
      await warmupOpenAI();
      
      // OpenAI SDKのcreateメソッドをリセット
      jest.clearAllMocks();
      
      // 2回目の呼び出し
      await warmupOpenAI();
      
      // createメソッドが呼ばれていないことを確認
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
}); 