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
 * ユーザーコンテキストサービスのインターフェース
 */
export interface UserContextService {
  /**
   * ユーザーコンテキストを取得
   * @returns ユーザーコンテキスト
   */
  getUserContext(): UserContext;
  
  /**
   * ユーザーコンテキストを保存
   * @param context 保存するユーザーコンテキスト
   */
  saveUserContext(context: UserContext): void;
  
  /**
   * 会話トピックを取得
   * @returns 会話トピックの配列
   */
  getConversationTopics(): string[];
  
  /**
   * 会話トピックを保存
   * @param topics 保存する会話トピックの配列
   */
  saveConversationTopics(topics: string[]): void;
  
  /**
   * ユーザーの質問を記録
   * @param question ユーザーの質問
   */
  recordUserQuestion(question: string): void;
  
  /**
   * トピックを更新
   * @param topic トピック名
   * @param details トピックの詳細
   */
  updateTopic(topic: string, details: string): void;
  
  /**
   * ユーザーの好みを記録
   * @param key 好みのキー
   * @param value 好みの値
   */
  recordUserPreference(key: string, value: string | number | boolean): void;
  
  /**
   * あいまい表現を記録
   * @param expression あいまい表現
   * @param interpretation 解釈
   * @param confidence 確信度
   * @param contextFactors 文脈要素
   */
  recordAmbiguousExpression(
    expression: string,
    interpretation: string,
    confidence?: number,
    contextFactors?: string[]
  ): void;
  
  /**
   * コンテキストプロンプトを生成
   * @returns コンテキストプロンプト
   */
  generateContextPrompt(): string;
  
  /**
   * ユーザーコンテキストをクリア
   */
  clearUserContext(): void;
  
  /**
   * キャッシュをリセット
   */
  resetCache(): void;
}

/**
 * ユーザーコンテキストサービスの実装クラス
 */
export class UserContextServiceImpl implements UserContextService {
  // メモリキャッシュ
  private userContextCache: UserContext | null = null;
  private conversationTopicsCache: string[] | null = null;
  private contextPromptCache: string | null = null;
  
  // 保存処理のスロットル用
  private saveTimeout: NodeJS.Timeout | null = null;
  private readonly SAVE_DELAY = 500; // 500ms
  
  // 依存関係
  private storageService: StorageService;
  
  /**
   * コンストラクタ
   * @param storageService ストレージサービス
   */
  constructor(storageService?: StorageService) {
    this.storageService = storageService || getStorageService();
  }
  
  /**
   * ユーザーコンテキストを取得
   * @returns ユーザーコンテキスト
   */
  getUserContext(): UserContext {
    // キャッシュがあればそれを返す
    if (this.userContextCache) {
      return this.userContextCache;
    }
    
    // ストレージから取得
    const storedContext = this.storageService.getItem(USER_CONTEXT_KEY);
    
    if (storedContext) {
      try {
        // JSONをパース
        const parsedContext = JSON.parse(storedContext);
        // キャッシュに保存
        this.userContextCache = parsedContext;
        return parsedContext;
      } catch (e) {
        console.error('ユーザーコンテキストのパースエラー:', e);
      }
    }
    
    // デフォルト値を返す
    this.userContextCache = { ...defaultUserContext };
    return this.userContextCache;
  }
  
  /**
   * ユーザーコンテキストを保存
   * @param context 保存するユーザーコンテキスト
   */
  saveUserContext(context: UserContext): void {
    // キャッシュを更新
    this.userContextCache = { ...context };
    
    // スロットル処理（短時間に何度も保存しないようにする）
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      try {
        // JSONに変換してストレージに保存
        this.storageService.setItem(USER_CONTEXT_KEY, JSON.stringify(context));
      } catch (e) {
        console.error('ユーザーコンテキストの保存エラー:', e);
      }
      this.saveTimeout = null;
    }, this.SAVE_DELAY);
  }
  
  /**
   * 会話トピックを取得
   * @returns 会話トピックの配列
   */
  getConversationTopics(): string[] {
    // キャッシュがあればそれを返す
    if (this.conversationTopicsCache) {
      return this.conversationTopicsCache;
    }
    
    // ストレージから取得
    const storedTopics = this.storageService.getItem(CONVERSATION_TOPICS_KEY);
    
    if (storedTopics) {
      try {
        // JSONをパース
        const parsedTopics = JSON.parse(storedTopics);
        // キャッシュに保存
        this.conversationTopicsCache = parsedTopics;
        return parsedTopics;
      } catch (e) {
        console.error('会話トピックのパースエラー:', e);
      }
    }
    
    // デフォルト値を返す
    this.conversationTopicsCache = [];
    return this.conversationTopicsCache;
  }
  
  /**
   * 会話トピックを保存
   * @param topics 保存する会話トピックの配列
   */
  saveConversationTopics(topics: string[]): void {
    // キャッシュを更新
    this.conversationTopicsCache = [...topics];
    
    try {
      // JSONに変換してストレージに保存
      this.storageService.setItem(CONVERSATION_TOPICS_KEY, JSON.stringify(topics));
    } catch (e) {
      console.error('会話トピックの保存エラー:', e);
    }
  }
  
  /**
   * ユーザーの質問を記録
   * @param question ユーザーの質問
   */
  recordUserQuestion(question: string): void {
    const context = this.getUserContext();
    
    // 新しい質問を追加
    const newQuestion = {
      text: question,
      timestamp: Date.now()
    };
    
    // 最大10件まで保持
    const recentQuestions = [
      newQuestion,
      ...context.recentQuestions.slice(0, 9)
    ];
    
    // コンテキストを更新して保存
    this.saveUserContext({
      ...context,
      recentQuestions
    });
  }
  
  /**
   * トピックを更新
   * @param topic トピック名
   * @param details トピックの詳細
   */
  updateTopic(topic: string, details: string): void {
    const context = this.getUserContext();
    
    // トピックを更新
    const updatedTopics = {
      ...context.topics,
      [topic]: {
        lastMentioned: Date.now(),
        details
      }
    };
    
    // コンテキストを更新して保存
    this.saveUserContext({
      ...context,
      topics: updatedTopics
    });
  }
  
  /**
   * ユーザーの好みを記録
   * @param key 好みのキー
   * @param value 好みの値
   */
  recordUserPreference(key: string, value: string | number | boolean): void {
    const context = this.getUserContext();
    
    // 好みを更新
    const updatedPreferences = {
      ...context.preferences,
      [key]: value
    };
    
    // コンテキストを更新して保存
    this.saveUserContext({
      ...context,
      preferences: updatedPreferences
    });
  }
  
  /**
   * あいまい表現を記録
   * @param expression あいまい表現
   * @param interpretation 解釈
   * @param confidence 確信度
   * @param contextFactors 文脈要素
   */
  recordAmbiguousExpression(
    expression: string,
    interpretation: string,
    confidence: number = 0.8,
    contextFactors: string[] = []
  ): void {
    const context = this.getUserContext();
    
    // 新しいあいまい表現を追加
    const newExpression: AmbiguousExpression = {
      expression,
      interpretation,
      timestamp: Date.now(),
      confidence,
      contextFactors
    };
    
    // 最大20件まで保持
    const ambiguousExpressions = [
      newExpression,
      ...context.ambiguousExpressions.slice(0, 19)
    ];
    
    // コンテキストを更新して保存
    this.saveUserContext({
      ...context,
      ambiguousExpressions
    });
  }
  
  /**
   * コンテキストプロンプトを生成
   * @returns コンテキストプロンプト
   */
  generateContextPrompt(): string {
    // キャッシュがあればそれを返す
    if (this.contextPromptCache) {
      return this.contextPromptCache;
    }
    
    const context = this.getUserContext();
    const topics = this.getConversationTopics();
    
    // プロンプトの構築
    let prompt = '【ユーザーコンテキスト情報】\n';
    
    // 好みの情報
    if (Object.keys(context.preferences).length > 0) {
      prompt += '■ユーザーの好み:\n';
      for (const [key, value] of Object.entries(context.preferences)) {
        prompt += `・${key}: ${value}\n`;
      }
      prompt += '\n';
    }
    
    // 最近の質問
    if (context.recentQuestions.length > 0) {
      prompt += '■最近の質問:\n';
      context.recentQuestions.slice(0, 5).forEach(q => {
        prompt += `・${q.text}\n`;
      });
      prompt += '\n';
    }
    
    // 会話トピック
    if (topics.length > 0) {
      prompt += '■会話のトピック:\n';
      prompt += topics.join('、') + '\n\n';
    }
    
    // トピックの詳細情報
    const recentTopics = Object.entries(context.topics)
      .sort((a, b) => b[1].lastMentioned - a[1].lastMentioned)
      .slice(0, 5);
    
    if (recentTopics.length > 0) {
      prompt += '■トピックの詳細:\n';
      recentTopics.forEach(([topic, info]) => {
        prompt += `・${topic}: ${info.details}\n`;
      });
      prompt += '\n';
    }
    
    // あいまい表現
    if (context.ambiguousExpressions.length > 0) {
      prompt += '■過去のあいまい表現:\n';
      context.ambiguousExpressions.slice(0, 3).forEach(exp => {
        prompt += `・「${exp.expression}」→ ${exp.interpretation} (確信度: ${Math.round(exp.confidence! * 100)}%)\n`;
      });
      prompt += '\n';
    }
    
    // キャッシュに保存
    this.contextPromptCache = prompt;
    return prompt;
  }
  
  /**
   * ユーザーコンテキストをクリア
   */
  clearUserContext(): void {
    // キャッシュをクリア
    this.userContextCache = { ...defaultUserContext };
    this.contextPromptCache = null;
    
    // ストレージから削除
    this.storageService.removeItem(USER_CONTEXT_KEY);
  }
  
  /**
   * キャッシュをリセット
   */
  resetCache(): void {
    this.userContextCache = null;
    this.conversationTopicsCache = null;
    this.contextPromptCache = null;
  }
}

/**
 * デフォルトのユーザーコンテキストサービスを取得
 * @param storageService ストレージサービス（省略可）
 * @returns ユーザーコンテキストサービス
 */
export function getUserContextService(storageService?: StorageService): UserContextService {
  if (!defaultUserContextService) {
    defaultUserContextService = new UserContextServiceImpl(storageService);
  }
  return defaultUserContextService;
}

/**
 * テスト用にユーザーコンテキストサービスをリセット
 */
export function resetUserContextService(): void {
  if (defaultUserContextService) {
    defaultUserContextService.resetCache();
  }
  defaultUserContextService = null;
}

/**
 * テスト用にカスタムユーザーコンテキストサービスを設定
 * @param service 設定するユーザーコンテキストサービス
 */
export function setUserContextService(service: UserContextService): void {
  defaultUserContextService = service;
} 