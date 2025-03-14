import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * OpenAIメッセージの型定義
 */
export type OpenAIMessage = ChatCompletionMessageParam;

/**
 * チャット完了レスポンスの型定義
 */
export interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

/**
 * ストリーミングデルタの型定義
 */
export interface StreamingDelta {
  choices: {
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }[];
}

/**
 * OpenAIサービスのインターフェース
 */
export interface OpenAIService {
  /**
   * チャット完了リクエストを送信
   * @param messages メッセージ配列
   * @param options オプション
   * @returns チャット完了レスポンス
   */
  createChatCompletion(
    messages: OpenAIMessage[],
    options?: ChatCompletionOptions
  ): Promise<ChatCompletionResponse>;
  
  /**
   * ストリーミングチャット完了リクエストを送信
   * @param messages メッセージ配列
   * @param options オプション
   * @param callback ストリーミングデータを受け取るコールバック
   * @returns 完了時に解決するPromise
   */
  createStreamingChatCompletion(
    messages: OpenAIMessage[],
    options?: ChatCompletionOptions,
    callback?: (delta: StreamingDelta) => void
  ): Promise<void>;
}

/**
 * チャット完了オプションの型定義
 */
export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
}

/**
 * OpenAI APIを使用したOpenAIサービスの実装
 */
export class OpenAIApiService implements OpenAIService {
  private client: OpenAI;
  private defaultModel: string;
  
  /**
   * コンストラクタ
   * @param apiKey OpenAI APIキー
   * @param defaultModel デフォルトのモデル名
   */
  constructor(apiKey?: string, defaultModel: string = 'gpt-3.5-turbo') {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    this.defaultModel = defaultModel;
  }
  
  /**
   * チャット完了リクエストを送信
   * @param messages メッセージ配列
   * @param options オプション
   * @returns チャット完了レスポンス
   */
  async createChatCompletion(
    messages: OpenAIMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
    } = options;
    
    const response = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
    });
    
    return response as unknown as ChatCompletionResponse;
  }
  
  /**
   * ストリーミングチャット完了リクエストを送信
   * @param messages メッセージ配列
   * @param options オプション
   * @param callback ストリーミングデータを受け取るコールバック
   * @returns 完了時に解決するPromise
   */
  async createStreamingChatCompletion(
    messages: OpenAIMessage[],
    options: ChatCompletionOptions = {},
    callback?: (delta: StreamingDelta) => void
  ): Promise<void> {
    const {
      model = this.defaultModel,
      temperature = 0.7,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
    } = options;
    
    const stream = await this.client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
      stream: true,
    });
    
    for await (const chunk of stream) {
      if (callback) {
        callback(chunk as unknown as StreamingDelta);
      }
    }
  }
}

/**
 * モック用OpenAIサービスの実装
 */
export class MockOpenAIService implements OpenAIService {
  private mockResponse: ChatCompletionResponse;
  private mockStreamingDeltas: StreamingDelta[];
  
  /**
   * コンストラクタ
   */
  constructor() {
    // デフォルトのモックレスポンス
    this.mockResponse = {
      id: 'mock-id',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'これはモックレスポンスです。',
          },
          finish_reason: 'stop',
        },
      ],
    };
    
    // デフォルトのモックストリーミングデルタ
    this.mockStreamingDeltas = [
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
              content: 'これは',
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
              content: 'モック',
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
              content: 'レスポンスです。',
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
              content: '',
            },
            finish_reason: 'stop',
          },
        ],
      },
    ];
  }
  
  /**
   * モックレスポンスを設定
   * @param response モックレスポンス
   */
  setMockResponse(response: ChatCompletionResponse): void {
    this.mockResponse = response;
  }
  
  /**
   * モックストリーミングデルタを設定
   * @param deltas モックストリーミングデルタ配列
   */
  setMockStreamingDeltas(deltas: StreamingDelta[]): void {
    this.mockStreamingDeltas = deltas;
  }
  
  /**
   * チャット完了リクエストを送信
   * @param messages メッセージ配列
   * @param options オプション
   * @returns チャット完了レスポンス
   */
  async createChatCompletion(
    messages: OpenAIMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<ChatCompletionResponse> {
    return this.mockResponse;
  }
  
  /**
   * ストリーミングチャット完了リクエストを送信
   * @param messages メッセージ配列
   * @param options オプション
   * @param callback ストリーミングデータを受け取るコールバック
   * @returns 完了時に解決するPromise
   */
  async createStreamingChatCompletion(
    messages: OpenAIMessage[],
    options: ChatCompletionOptions = {},
    callback?: (delta: StreamingDelta) => void
  ): Promise<void> {
    if (callback) {
      for (const delta of this.mockStreamingDeltas) {
        callback(delta);
        // 非同期性をシミュレート
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }
}

// デフォルトのOpenAIサービスインスタンス
let defaultOpenAIService: OpenAIService | null = null;

/**
 * デフォルトのOpenAIサービスを取得
 * @returns OpenAIサービスインスタンス
 */
export function getOpenAIService(): OpenAIService {
  if (!defaultOpenAIService) {
    defaultOpenAIService = new OpenAIApiService();
  }
  return defaultOpenAIService;
}

/**
 * OpenAIサービスを設定
 * @param service OpenAIサービスインスタンス
 */
export function setOpenAIService(service: OpenAIService): void {
  defaultOpenAIService = service;
}

/**
 * プリウォーミング用のフラグ
 */
let isWarmedUp = false;

/**
 * OpenAI接続をプリウォーミング
 */
export async function warmupOpenAI(): Promise<void> {
  if (isWarmedUp) return;
  
  try {
    const service = getOpenAIService();
    
    // 軽量なリクエストを送信して接続を初期化
    await service.createChatCompletion(
      [{ role: 'user', content: 'Hello' }],
      {
        max_tokens: 5,
        temperature: 0.0,
      }
    );
    
    isWarmedUp = true;
    console.log('OpenAI接続のプリウォーミングが完了しました');
  } catch (error) {
    console.error('OpenAI接続のプリウォーミングに失敗しました:', error);
  }
}

/**
 * プリウォーミング状態を取得
 * @returns プリウォーミング済みかどうか
 */
export function getWarmupStatus(): boolean {
  return isWarmedUp;
}

/**
 * プリウォーミング状態をリセット（テスト用）
 */
export function resetWarmupStatus(): void {
  isWarmedUp = false;
} 