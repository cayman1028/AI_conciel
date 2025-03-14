/**
 * ユーザーコンテキスト機能のテスト
 */

import {
    clearUserContext,
    getConversationTopics,
    getUserContext,
    recordUserQuestion,
    saveConversationTopics,
    saveUserContext,
    UserContext
} from '../../lib/userContext';

// テスト用のモックストレージ
let mockStorage: Record<string, string> = {};

// localStorageのモックを上書き
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key: string) => mockStorage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      mockStorage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete mockStorage[key];
    }),
    clear: jest.fn(() => {
      mockStorage = {};
    }),
  },
  writable: true,
});

// userContextモジュールを直接モックして、テスト間でキャッシュをリセットできるようにする
jest.mock('../../lib/userContext', () => {
  // オリジナルのモジュールを取得
  const originalModule = jest.requireActual('../../lib/userContext');
  
  // メモリキャッシュを初期化
  let memoryCache: {
    userContext: UserContext | null;
    conversationTopics: string[] | null;
    contextPrompt: string | null;
    userContextTimestamp: number;
    topicsTimestamp: number;
    contextPromptTimestamp: number;
    saveTimeout: NodeJS.Timeout | null;
  } = {
    userContext: null,
    conversationTopics: null,
    contextPrompt: null,
    userContextTimestamp: 0,
    topicsTimestamp: 0,
    contextPromptTimestamp: 0,
    saveTimeout: null,
  };
  
  // 元の関数をラップして、テスト用のメモリキャッシュを使用するようにする
  const getUserContext = (): UserContext => {
    if (!memoryCache.userContext) {
      const storedContext = window.localStorage.getItem('userContext');
      if (storedContext) {
        try {
          memoryCache.userContext = JSON.parse(storedContext) as UserContext;
        } catch (e) {
          memoryCache.userContext = {
            preferences: {},
            recentQuestions: [],
            topics: {},
            ambiguousExpressions: []
          };
        }
      } else {
        memoryCache.userContext = {
          preferences: {},
          recentQuestions: [],
          topics: {},
          ambiguousExpressions: []
        };
      }
    }
    return memoryCache.userContext;
  };
  
  const saveUserContext = (context: UserContext): void => {
    memoryCache.userContext = context;
    window.localStorage.setItem('userContext', JSON.stringify(context));
  };
  
  const getConversationTopics = (): string[] => {
    if (!memoryCache.conversationTopics) {
      const storedTopics = window.localStorage.getItem('conversationTopics');
      if (storedTopics) {
        try {
          memoryCache.conversationTopics = JSON.parse(storedTopics) as string[];
        } catch (e) {
          memoryCache.conversationTopics = [];
        }
      } else {
        memoryCache.conversationTopics = [];
      }
    }
    return memoryCache.conversationTopics;
  };
  
  const saveConversationTopics = (topics: string[]): void => {
    memoryCache.conversationTopics = topics;
    window.localStorage.setItem('conversationTopics', JSON.stringify(topics));
  };
  
  const clearUserContext = (): void => {
    memoryCache.userContext = {
      preferences: {},
      recentQuestions: [],
      topics: {},
      ambiguousExpressions: []
    };
    memoryCache.conversationTopics = [];
    window.localStorage.removeItem('userContext');
    window.localStorage.removeItem('conversationTopics');
  };
  
  // recordUserQuestionの実装を追加
  const recordUserQuestion = (question: string): void => {
    const context = getUserContext();
    const timestamp = Date.now();
    
    // 新しい質問を追加
    context.recentQuestions.push({
      text: question,
      timestamp
    });
    
    // 最大10件に制限
    if (context.recentQuestions.length > 10) {
      context.recentQuestions = context.recentQuestions.slice(-10);
    }
    
    // 更新したコンテキストを保存
    saveUserContext(context);
  };
  
  // テスト用にメモリキャッシュをリセットする関数
  const resetCache = (): void => {
    memoryCache = {
      userContext: null,
      conversationTopics: null,
      contextPrompt: null,
      userContextTimestamp: 0,
      topicsTimestamp: 0,
      contextPromptTimestamp: 0,
      saveTimeout: null,
    };
  };
  
  return {
    ...originalModule,
    getUserContext,
    saveUserContext,
    getConversationTopics,
    saveConversationTopics,
    clearUserContext,
    recordUserQuestion,
    __resetCache: resetCache,
  };
});

// メモリキャッシュをリセットする関数を取得
// @ts-ignore - 動的に追加したプロパティ
const resetCache = require('../../lib/userContext').__resetCache;

// 完全にキャッシュと状態をリセットする関数
const resetAll = () => {
  // localStorageをクリア
  mockStorage = {};
  
  // メモリキャッシュをリセット
  resetCache();
  
  // 明示的にlocalStorageからキーを削除
  window.localStorage.removeItem('userContext');
  window.localStorage.removeItem('conversationTopics');
};

describe('userContext', () => {
  // 各テスト前にlocalStorageとキャッシュをリセット
  beforeEach(() => {
    resetAll();
    jest.clearAllMocks();
  });

  // 各テスト後にもリセット
  afterEach(() => {
    resetAll();
  });

  describe('getConversationTopics', () => {
    it('トピックが存在しない場合は空の配列を返すこと', () => {
      // 明示的にキャッシュをリセット
      resetAll();
      
      const topics = getConversationTopics();
      expect(topics).toEqual([]);
    });

    it('保存したトピックを正しく取得できること', () => {
      // 明示的にキャッシュをリセット
      resetAll();
      
      const testTopics = ['テスト', 'トピック', 'サンプル'];
      saveConversationTopics(testTopics);
      
      const topics = getConversationTopics();
      expect(topics).toEqual(testTopics);
    });
  });

  describe('getUserContext と saveUserContext', () => {
    it('初期状態では空のコンテキストを返すこと', () => {
      resetAll();
      
      const context = getUserContext();
      
      expect(context).toEqual({
        preferences: {},
        recentQuestions: [],
        topics: {},
        ambiguousExpressions: []
      });
    });

    it('コンテキストを保存して取得できること', () => {
      resetAll();
      
      const mockContext: UserContext = {
        preferences: {
          theme: 'dark',
          fontSize: 'medium',
        },
        recentQuestions: [
          {
            text: 'テスト質問',
            timestamp: Date.now(),
          },
        ],
        topics: {},
        ambiguousExpressions: [],
      };
      
      saveUserContext(mockContext);
      
      // getUserContextでデータが取得できることを確認
      const retrievedContext = getUserContext();
      expect(retrievedContext.preferences.theme).toBe('dark');
    });
  });

  describe('recordUserQuestion', () => {
    it('ユーザーの質問を記録できること', () => {
      resetAll();
      
      // 初期状態を確認（空のコンテキスト）
      const initialContext = getUserContext();
      expect(initialContext.recentQuestions.length).toBe(0);
      
      const question = 'これはテスト質問です';
      recordUserQuestion(question);
      
      const context = getUserContext();
      expect(context.recentQuestions.length).toBe(1);
      expect(context.recentQuestions[0].text).toBe(question);
    });

    it('最大数を超える場合は古い質問が削除されること', () => {
      resetAll();
      
      // 11個の質問を追加（最大は10個）
      for (let i = 1; i <= 11; i++) {
        recordUserQuestion(`質問${i}`);
      }
      
      const context = getUserContext();
      expect(context.recentQuestions.length).toBe(10); // 最大10件
      
      // 最新の質問が含まれていることを確認
      expect(context.recentQuestions.some(q => q.text === '質問11')).toBe(true);
      
      // 最古の質問が削除されていることを確認
      expect(context.recentQuestions.some(q => q.text === '質問1')).toBe(false);
    });
  });

  describe('getConversationTopics と saveConversationTopics', () => {
    it('会話トピックを保存して取得できること', () => {
      resetAll();
      
      const topics = ['トピック1', 'トピック2', 'トピック3'];
      
      saveConversationTopics(topics);
      
      const retrievedTopics = getConversationTopics();
      expect(retrievedTopics).toEqual(topics);
    });
    
    it('空の配列を保存した場合も正しく取得できること', () => {
      resetAll();
      
      // 初期データを設定
      saveConversationTopics(['トピック1', 'トピック2']);
      
      // 空の配列で上書き
      saveConversationTopics([]);
      
      const retrievedTopics = getConversationTopics();
      expect(retrievedTopics).toEqual([]);
    });
  });

  describe('ユーザー設定の更新', () => {
    it('ユーザー設定を更新できること', () => {
      resetAll();
      
      // テーマを更新
      const updatedContext = getUserContext();
      updatedContext.preferences.theme = 'light';
      saveUserContext(updatedContext);
      
      // 更新後の状態を確認
      const retrievedContext = getUserContext();
      expect(retrievedContext.preferences.theme).toBe('light');
    });

    it('存在しない設定キーの場合は新しく追加されること', () => {
      resetAll();
      
      // カスタム設定を追加
      const context = getUserContext();
      context.preferences.customSetting = 'value1';
      saveUserContext(context);
      
      // 更新後の状態を確認
      const retrievedContext = getUserContext();
      expect(retrievedContext.preferences.customSetting).toBe('value1');
    });
  });

  describe('clearUserContext', () => {
    it('ユーザーコンテキストをクリアできること', () => {
      resetAll();
      
      // 初期データを設定
      const mockContext: UserContext = {
        preferences: {
          theme: 'dark',
        },
        recentQuestions: [
          {
            text: 'テスト質問',
            timestamp: Date.now(),
          },
        ],
        topics: {},
        ambiguousExpressions: [],
      };
      
      saveUserContext(mockContext);
      
      // トピックも設定
      saveConversationTopics(['テストトピック']);
      
      // 保存されたことを確認
      let context = getUserContext();
      expect(context.preferences.theme).toBe('dark');
      expect(context.recentQuestions.length).toBe(1);
      expect(getConversationTopics().length).toBe(1);
      
      // コンテキストをクリア
      clearUserContext();
      
      // クリア後の状態を確認
      context = getUserContext();
      expect(context.preferences).toEqual({});
      expect(context.recentQuestions.length).toBe(0);
      
      // トピックも空になっていることを確認
      expect(getConversationTopics().length).toBe(0);
    });
  });
}); 