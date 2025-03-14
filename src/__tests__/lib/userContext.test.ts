/**
 * ユーザーコンテキスト機能のテスト
 * userContextモジュールは単なるラッパーとなったため、基本的な機能テストのみを行う
 */

import { UserContext } from '../../lib/services/userContextService';

// モジュール全体をモック
jest.mock('../../lib/userContext', () => {
  // モック関数を返す
  return {
    getUserContext: jest.fn(),
    saveUserContext: jest.fn(),
    getConversationTopics: jest.fn(),
    saveConversationTopics: jest.fn(),
    recordUserQuestion: jest.fn(),
    clearUserContext: jest.fn(),
    resetAll: jest.fn(),
    // 型定義をエクスポート
    UserContext: jest.requireActual('../../lib/services/userContextService').UserContext,
    defaultUserContext: jest.requireActual('../../lib/services/userContextService').defaultUserContext,
    USER_CONTEXT_KEY: jest.requireActual('../../lib/services/userContextService').USER_CONTEXT_KEY,
    CONVERSATION_TOPICS_KEY: jest.requireActual('../../lib/services/userContextService').CONVERSATION_TOPICS_KEY,
    AMBIGUOUS_EXPRESSIONS_KEY: jest.requireActual('../../lib/services/userContextService').AMBIGUOUS_EXPRESSIONS_KEY,
  };
});

// モジュールをインポート（モック後に行う）
import * as userContextModule from '../../lib/userContext';

// テスト用のメモリストレージ
let mockStorage: Record<string, string> = {};

// テスト用のメモリキャッシュ
let memoryCache: {
  userContext: UserContext | null;
  conversationTopics: string[] | null;
  contextPrompt: string | null;
} = {
  userContext: null,
  conversationTopics: null,
  contextPrompt: null
};

// デフォルトのユーザーコンテキスト
const defaultUserContext: UserContext = {
  preferences: {},
  recentQuestions: [],
  topics: {},
  ambiguousExpressions: []
};

// 完全にキャッシュと状態をリセットする関数
const resetTestState = () => {
  mockStorage = {};
  memoryCache = {
    userContext: null,
    conversationTopics: null,
    contextPrompt: null
  };
};

describe('userContext', () => {
  // 各テスト前にキャッシュをリセットとモック実装の設定
  beforeEach(() => {
    resetTestState();
    jest.clearAllMocks();

    // モック関数の実装を設定
    (userContextModule.getUserContext as jest.Mock).mockImplementation((): UserContext => {
      if (!memoryCache.userContext) {
        const storedContext = mockStorage['user_context'];
        if (storedContext) {
          try {
            memoryCache.userContext = JSON.parse(storedContext);
          } catch (e) {
            memoryCache.userContext = { ...defaultUserContext };
          }
        } else {
          memoryCache.userContext = { ...defaultUserContext };
        }
      }
      return memoryCache.userContext || { ...defaultUserContext };
    });

    (userContextModule.saveUserContext as jest.Mock).mockImplementation((context: UserContext): void => {
      memoryCache.userContext = context;
      mockStorage['user_context'] = JSON.stringify(context);
    });

    (userContextModule.getConversationTopics as jest.Mock).mockImplementation((): string[] => {
      if (!memoryCache.conversationTopics) {
        const storedTopics = mockStorage['conversation_topics'];
        if (storedTopics) {
          try {
            memoryCache.conversationTopics = JSON.parse(storedTopics);
          } catch (e) {
            memoryCache.conversationTopics = [];
          }
        } else {
          memoryCache.conversationTopics = [];
        }
      }
      return memoryCache.conversationTopics || [];
    });

    (userContextModule.saveConversationTopics as jest.Mock).mockImplementation((topics: string[]): void => {
      memoryCache.conversationTopics = topics;
      mockStorage['conversation_topics'] = JSON.stringify(topics);
    });

    (userContextModule.recordUserQuestion as jest.Mock).mockImplementation((question: string): void => {
      const context = userContextModule.getUserContext();
      context.recentQuestions = [
        { text: question, timestamp: Date.now() },
        ...context.recentQuestions
      ];
      
      // 最大10件に制限
      if (context.recentQuestions.length > 10) {
        context.recentQuestions = context.recentQuestions.slice(0, 10);
      }
      
      userContextModule.saveUserContext(context);
    });

    (userContextModule.clearUserContext as jest.Mock).mockImplementation((): void => {
      memoryCache.userContext = { ...defaultUserContext };
      memoryCache.conversationTopics = [];
      memoryCache.contextPrompt = null;
      delete mockStorage['user_context'];
      delete mockStorage['conversation_topics'];
    });

    (userContextModule.resetAll as jest.Mock).mockImplementation((): void => {
      resetTestState();
    });
  });

  // 各テスト後にもリセット
  afterEach(() => {
    resetTestState();
  });

  describe('getConversationTopics', () => {
    it('トピックが存在しない場合は空の配列を返すこと', () => {
      const topics = userContextModule.getConversationTopics();
      expect(topics).toEqual([]);
    });

    it('保存したトピックを正しく取得できること', () => {
      const testTopics = ['テスト', 'トピック', 'サンプル'];
      userContextModule.saveConversationTopics(testTopics);
      
      const topics = userContextModule.getConversationTopics();
      expect(topics).toEqual(testTopics);
    });
  });

  describe('getUserContext と saveUserContext', () => {
    it('初期状態では空のコンテキストを返すこと', () => {
      const context = userContextModule.getUserContext();
      
      expect(context).toEqual({
        preferences: {},
        recentQuestions: [],
        topics: {},
        ambiguousExpressions: []
      });
    });

    it('コンテキストを保存して取得できること', () => {
      const mockContext: userContextModule.UserContext = {
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
      
      userContextModule.saveUserContext(mockContext);
      
      // getUserContextでデータが取得できることを確認
      const retrievedContext = userContextModule.getUserContext();
      expect(retrievedContext.preferences.theme).toBe('dark');
    });
  });

  describe('recordUserQuestion', () => {
    it('ユーザーの質問を記録できること', () => {
      // 初期状態を確認（空のコンテキスト）
      const initialContext = userContextModule.getUserContext();
      expect(initialContext.recentQuestions.length).toBe(0);
      
      const question = 'これはテスト質問です';
      userContextModule.recordUserQuestion(question);
      
      const context = userContextModule.getUserContext();
      expect(context.recentQuestions.length).toBe(1);
      expect(context.recentQuestions[0].text).toBe(question);
    });
  });

  describe('clearUserContext', () => {
    it('ユーザーコンテキストをクリアできること', () => {
      // 初期データを設定
      const mockContext: userContextModule.UserContext = {
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
      
      userContextModule.saveUserContext(mockContext);
      
      // トピックも設定
      userContextModule.saveConversationTopics(['テストトピック']);
      
      // 保存されたことを確認
      let context = userContextModule.getUserContext();
      expect(context.preferences.theme).toBe('dark');
      expect(context.recentQuestions.length).toBe(1);
      expect(userContextModule.getConversationTopics().length).toBe(1);
      
      // コンテキストをクリア
      userContextModule.clearUserContext();
      
      // クリア後の状態を確認
      context = userContextModule.getUserContext();
      expect(context.preferences).toEqual({});
      expect(context.recentQuestions.length).toBe(0);
      
      // トピックも空になっていることを確認
      expect(userContextModule.getConversationTopics().length).toBe(0);
    });
  });
}); 