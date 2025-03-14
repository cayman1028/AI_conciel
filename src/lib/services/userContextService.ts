import { StorageService, getStorageService } from './storageService';

// ローカルストレージのキー
export const USER_CONTEXT_KEY = 'user_context';
export const CONVERSATION_TOPICS_KEY = 'conversation_topics';
export const AMBIGUOUS_EXPRESSIONS_KEY = 'ambiguous_expressions';

// シングルトンインスタンス
let defaultUserContextService: UserContextService | null = null;

// あいまい表現の型定義
export interface AmbiguousExpression {
  expression: string;
  interpretation: string;
  timestamp: number;
  confidence?: number;
  contextFactors?: string[];
  topic?: string;
  situation?: string;
}

// ユーザーコンテキストの型定義
export interface UserContext {
  preferences: {
    [key: string]: string | number | boolean;
  };
  recentQuestions: {
    text: string;
    timestamp: number;
  }[];
  topics: {
    [key: string]: {
      lastMentioned: number;
      details: string;
    };
  };
  ambiguousExpressions: AmbiguousExpression[];
}

// デフォルトのユーザーコンテキスト
export const defaultUserContext: UserContext = {
  preferences: {},
  recentQuestions: [],
  topics: {},
  ambiguousExpressions: [],
};

/**
 * ユーザーコンテキストサービスクラス
 */
export class UserContextService {
  private storageService: StorageService;
  
  // メモリキャッシュ（高速化のため）
  private memoryCache: {
    userContext: UserContext | null;
    conversationTopics: string[] | null;
    contextPrompt: string | null;
    userContextTimestamp: number;
    topicsTimestamp: number;
    contextPromptTimestamp: number;
    saveTimeout: NodeJS.Timeout | null;
  };
  
  // キャッシュの有効期限（60秒）
  private readonly CACHE_TTL = 60 * 1000;
  
  /**
   * コンストラクタ
   * @param storageService ストレージサービス
   */
  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.memoryCache = {
      userContext: null,
      conversationTopics: null,
      contextPrompt: null,
      userContextTimestamp: 0,
      topicsTimestamp: 0,
      contextPromptTimestamp: 0,
      saveTimeout: null
    };
  }
  
  /**
   * ユーザーコンテキストの取得（キャッシュ対応）
   * @returns ユーザーコンテキスト
   */
  getUserContext(): UserContext {
    // キャッシュにあればそれを返す
    if (this.memoryCache.userContext) {
      return this.memoryCache.userContext;
    }
    
    const storedContext = this.storageService.getItem(USER_CONTEXT_KEY);
    if (storedContext) {
      try {
        const parsedContext = JSON.parse(storedContext);
        // キャッシュに保存
        this.memoryCache.userContext = parsedContext;
        return parsedContext;
      } catch (e) {
        console.error('ユーザーコンテキストの解析に失敗しました:', e);
        // キャッシュにデフォルト値を保存
        this.memoryCache.userContext = defaultUserContext;
        return defaultUserContext;
      }
    }
    
    // キャッシュにデフォルト値を保存
    this.memoryCache.userContext = defaultUserContext;
    return defaultUserContext;
  }
  
  /**
   * ユーザーコンテキストの保存（スロットル処理）
   * @param context ユーザーコンテキスト
   */
  saveUserContext(context: UserContext): void {
    // キャッシュを更新
    this.memoryCache.userContext = context;
    
    // コンテキストプロンプトのキャッシュをクリア（内容が変わったため）
    this.memoryCache.contextPrompt = null;
    
    // 既存のタイムアウトをクリア
    if (this.memoryCache.saveTimeout) {
      clearTimeout(this.memoryCache.saveTimeout);
    }
    
    // 非同期で保存（UIブロッキングを防止、頻繁な保存を防止）
    this.memoryCache.saveTimeout = setTimeout(() => {
      this.storageService.setItem(USER_CONTEXT_KEY, JSON.stringify(context));
      this.memoryCache.saveTimeout = null;
    }, 300);
  }
  
  /**
   * 会話トピックの取得（キャッシュ対応）
   * @returns 会話トピックの配列
   */
  getConversationTopics(): string[] {
    // キャッシュにあればそれを返す
    if (this.memoryCache.conversationTopics) {
      return this.memoryCache.conversationTopics;
    }
    
    const storedTopics = this.storageService.getItem(CONVERSATION_TOPICS_KEY);
    if (storedTopics) {
      try {
        const parsedTopics = JSON.parse(storedTopics);
        // キャッシュに保存
        this.memoryCache.conversationTopics = parsedTopics;
        return parsedTopics;
      } catch (e) {
        console.error('会話トピックの解析に失敗しました:', e);
        // キャッシュに空配列を保存
        this.memoryCache.conversationTopics = [];
        return [];
      }
    }
    
    // キャッシュに空配列を保存
    this.memoryCache.conversationTopics = [];
    return [];
  }
  
  /**
   * 会話トピックの保存
   * @param topics 会話トピックの配列
   */
  saveConversationTopics(topics: string[]): void {
    // キャッシュから取得または初期化
    const currentTopics = this.memoryCache.conversationTopics || this.getConversationTopics();
    
    // 重複を排除して新しいトピックを追加
    const newTopicsSet = new Set([...currentTopics]);
    topics.forEach(topic => newTopicsSet.add(topic));
    const newTopics = Array.from(newTopicsSet);
    
    // キャッシュを更新
    this.memoryCache.conversationTopics = newTopics;
    
    // コンテキストプロンプトのキャッシュをクリア（内容が変わったため）
    this.memoryCache.contextPrompt = null;
    
    // 非同期で保存（UIブロッキングを防止）
    setTimeout(() => {
      this.storageService.setItem(CONVERSATION_TOPICS_KEY, JSON.stringify(newTopics));
    }, 0);
  }
  
  /**
   * ユーザーの質問を記録
   * @param question ユーザーの質問
   */
  recordUserQuestion(question: string): void {
    // キャッシュから直接取得（または初期化）
    const context = this.memoryCache.userContext || this.getUserContext();
    
    // 最新の質問を先頭に追加（最大10件まで保存）
    context.recentQuestions = [
      { text: question, timestamp: Date.now() },
      ...context.recentQuestions.slice(0, 9)
    ];
    
    this.saveUserContext(context);
  }
  
  /**
   * トピックの更新
   * @param topic トピック名
   * @param details トピックの詳細
   */
  updateTopic(topic: string, details: string): void {
    // キャッシュから直接取得（または初期化）
    const context = this.memoryCache.userContext || this.getUserContext();
    
    context.topics[topic] = {
      lastMentioned: Date.now(),
      details
    };
    
    this.saveUserContext(context);
  }
  
  /**
   * ユーザーの好みを記録
   * @param key 好みのキー
   * @param value 好みの値
   */
  recordUserPreference(key: string, value: string | number | boolean): void {
    // キャッシュから直接取得（または初期化）
    const context = this.memoryCache.userContext || this.getUserContext();
    
    context.preferences[key] = value;
    
    this.saveUserContext(context);
  }
  
  /**
   * あいまい表現を記録
   * @param expression あいまい表現
   * @param interpretation 解釈
   * @param confidence 確信度
   * @param contextFactors コンテキスト要因
   */
  recordAmbiguousExpression(
    expression: string,
    interpretation: string,
    confidence: number = 0.8,
    contextFactors: string[] = []
  ): void {
    // キャッシュから直接取得（または初期化）
    const context = this.memoryCache.userContext || this.getUserContext();
    
    // 新しいあいまい表現を追加
    context.ambiguousExpressions.push({
      expression,
      interpretation,
      timestamp: Date.now(),
      confidence,
      contextFactors
    });
    
    // 最大50件に制限
    if (context.ambiguousExpressions.length > 50) {
      context.ambiguousExpressions = context.ambiguousExpressions.slice(-50);
    }
    
    this.saveUserContext(context);
  }
  
  /**
   * コンテキストプロンプトの生成
   * @returns コンテキストプロンプト
   */
  generateContextPrompt(): string {
    // キャッシュにあればそれを返す
    if (
      this.memoryCache.contextPrompt &&
      Date.now() - this.memoryCache.contextPromptTimestamp < this.CACHE_TTL
    ) {
      return this.memoryCache.contextPrompt;
    }
    
    // ユーザーコンテキストを取得
    const context = this.getUserContext();
    
    // 会話トピックを取得
    const topics = this.getConversationTopics();
    
    // プロンプトの構築
    let prompt = '【ユーザーコンテキスト】\n';
    
    // 好みの情報を追加
    if (Object.keys(context.preferences).length > 0) {
      prompt += '■ユーザーの好み:\n';
      Object.entries(context.preferences).forEach(([key, value]) => {
        prompt += `- ${key}: ${value}\n`;
      });
      prompt += '\n';
    }
    
    // 最近の質問を追加
    if (context.recentQuestions.length > 0) {
      prompt += '■最近の質問:\n';
      context.recentQuestions.slice(0, 5).forEach(q => {
        prompt += `- ${q.text}\n`;
      });
      prompt += '\n';
    }
    
    // トピックを追加
    if (Object.keys(context.topics).length > 0) {
      prompt += '■関連トピック:\n';
      Object.entries(context.topics)
        .sort((a, b) => b[1].lastMentioned - a[1].lastMentioned)
        .slice(0, 5)
        .forEach(([topic, data]) => {
          prompt += `- ${topic}: ${data.details}\n`;
        });
      prompt += '\n';
    }
    
    // 会話トピックを追加
    if (topics.length > 0) {
      prompt += '■会話トピック:\n';
      topics.slice(0, 10).forEach(topic => {
        prompt += `- ${topic}\n`;
      });
      prompt += '\n';
    }
    
    // あいまい表現を追加
    if (context.ambiguousExpressions.length > 0) {
      prompt += '■あいまい表現の解釈:\n';
      context.ambiguousExpressions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .forEach(exp => {
          prompt += `- "${exp.expression}" → ${exp.interpretation}\n`;
        });
      prompt += '\n';
    }
    
    // キャッシュに保存
    this.memoryCache.contextPrompt = prompt;
    this.memoryCache.contextPromptTimestamp = Date.now();
    
    return prompt;
  }
  
  /**
   * ユーザーコンテキストのクリア
   */
  clearUserContext(): void {
    // ストレージからクリア
    this.storageService.removeItem(USER_CONTEXT_KEY);
    this.storageService.removeItem(CONVERSATION_TOPICS_KEY);
    this.storageService.removeItem(AMBIGUOUS_EXPRESSIONS_KEY);
    
    // キャッシュをクリア
    this.memoryCache.userContext = null;
    this.memoryCache.conversationTopics = null;
    this.memoryCache.contextPrompt = null;
    this.memoryCache.userContextTimestamp = 0;
    this.memoryCache.topicsTimestamp = 0;
    this.memoryCache.contextPromptTimestamp = 0;
    
    // タイムアウトをクリア
    if (this.memoryCache.saveTimeout) {
      clearTimeout(this.memoryCache.saveTimeout);
      this.memoryCache.saveTimeout = null;
    }
  }
  
  /**
   * キャッシュのリセット（テスト用）
   */
  resetCache(): void {
    this.memoryCache.userContext = null;
    this.memoryCache.conversationTopics = null;
    this.memoryCache.contextPrompt = null;
    this.memoryCache.userContextTimestamp = 0;
    this.memoryCache.topicsTimestamp = 0;
    this.memoryCache.contextPromptTimestamp = 0;
    
    if (this.memoryCache.saveTimeout) {
      clearTimeout(this.memoryCache.saveTimeout);
      this.memoryCache.saveTimeout = null;
    }
  }
}

/**
 * ユーザーコンテキストサービスの取得
 * @param storageService カスタムストレージサービス（省略可）
 * @returns ユーザーコンテキストサービス
 */
export function getUserContextService(storageService?: StorageService): UserContextService {
  if (!defaultUserContextService) {
    defaultUserContextService = new UserContextService(
      storageService || getStorageService()
    );
  }
  return defaultUserContextService;
}

/**
 * ユーザーコンテキストサービスの設定（テスト用）
 * @param service ユーザーコンテキストサービス
 */
export function setUserContextService(service: UserContextService): void {
  defaultUserContextService = service;
}

/**
 * ユーザーコンテキストサービスのリセット（テスト用）
 */
export function resetUserContextService(): void {
  if (defaultUserContextService) {
    defaultUserContextService.resetCache();
  }
  defaultUserContextService = null;
} 