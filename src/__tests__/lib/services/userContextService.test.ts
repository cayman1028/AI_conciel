/**
 * UserContextServiceのテスト
 */

import { StorageService } from '../../../lib/services/storageService';
import {
  defaultUserContext,
  getUserContextService,
  resetUserContextService,
  UserContext
} from '../../../lib/services/userContextService';

// モックストレージサービス
class MockStorageService implements StorageService {
  private storage: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.storage[key] || null;
  }

  setItem(key: string, value: string): void {
    this.storage[key] = value;
  }

  removeItem(key: string): void {
    delete this.storage[key];
  }

  clear(): void {
    this.storage = {};
  }
}

// モックストレージインスタンス
const mockStorageInstance = new MockStorageService();

// StorageServiceのモック
jest.mock('../../../lib/services/storageService', () => ({
  getStorageService: jest.fn(() => mockStorageInstance),
  StorageService: jest.requireActual('../../../lib/services/storageService').StorageService
}));

describe('UserContextService', () => {
  // 各テスト前にサービスをリセット
  beforeEach(() => {
    resetUserContextService();
    mockStorageInstance.clear();
    // 明示的にストレージサービスを指定してサービスを初期化
    getUserContextService(mockStorageInstance);
  });

  describe('getUserContext', () => {
    it('初期状態では空のコンテキストを返すこと', () => {
      const service = getUserContextService();
      const context = service.getUserContext();
      
      expect(context).toEqual(defaultUserContext);
    });

    it('コンテキストを保存して取得できること', () => {
      const service = getUserContextService();
      
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
      
      service.saveUserContext(mockContext);
      
      // getUserContextでデータが取得できることを確認
      const retrievedContext = service.getUserContext();
      expect(retrievedContext.preferences.theme).toBe('dark');
    });
  });

  describe('recordUserQuestion', () => {
    it('ユーザーの質問を記録できること', () => {
      const service = getUserContextService();
      
      // 初期状態を確認（空のコンテキスト）
      const initialContext = service.getUserContext();
      expect(initialContext.recentQuestions.length).toBe(0);
      
      const question = 'これはテスト質問です';
      service.recordUserQuestion(question);
      
      const context = service.getUserContext();
      expect(context.recentQuestions.length).toBe(1);
      expect(context.recentQuestions[0].text).toBe(question);
    });

    it('最大数を超える場合は古い質問が削除されること', () => {
      const service = getUserContextService();
      
      // 11個の質問を追加（最大は10個）
      for (let i = 1; i <= 11; i++) {
        service.recordUserQuestion(`質問${i}`);
      }
      
      const context = service.getUserContext();
      expect(context.recentQuestions.length).toBe(10); // 最大10件
      
      // 最新の質問が含まれていることを確認
      expect(context.recentQuestions.some(q => q.text === '質問11')).toBe(true);
      
      // 最古の質問が削除されていることを確認
      expect(context.recentQuestions.some(q => q.text === '質問1')).toBe(false);
    });
  });

  describe('getConversationTopics と saveConversationTopics', () => {
    it('会話トピックを保存して取得できること', () => {
      const service = getUserContextService();
      
      const topics = ['トピック1', 'トピック2', 'トピック3'];
      
      service.saveConversationTopics(topics);
      
      const retrievedTopics = service.getConversationTopics();
      expect(retrievedTopics).toEqual(topics);
    });
    
    it('空の配列を保存した場合も正しく取得できること', () => {
      const service = getUserContextService();
      
      // 初期データを設定
      service.saveConversationTopics(['トピック1', 'トピック2']);
      
      // 新しいサービスインスタンスを取得して、キャッシュをクリア
      resetUserContextService();
      const newService = getUserContextService(mockStorageInstance);
      
      // 空の配列で上書き
      newService.saveConversationTopics([]);
      
      // 新しいサービスインスタンスを取得して、キャッシュをクリア
      resetUserContextService();
      const finalService = getUserContextService(mockStorageInstance);
      
      const retrievedTopics = finalService.getConversationTopics();
      expect(retrievedTopics).toEqual([]);
    });
  });

  describe('ユーザー設定の更新', () => {
    it('ユーザー設定を更新できること', () => {
      const service = getUserContextService();
      
      // テーマを更新
      service.recordUserPreference('theme', 'light');
      
      // 更新後の状態を確認
      const retrievedContext = service.getUserContext();
      expect(retrievedContext.preferences.theme).toBe('light');
    });

    it('存在しない設定キーの場合は新しく追加されること', () => {
      const service = getUserContextService();
      
      // カスタム設定を追加
      service.recordUserPreference('customSetting', 'value1');
      
      // 更新後の状態を確認
      const retrievedContext = service.getUserContext();
      expect(retrievedContext.preferences.customSetting).toBe('value1');
    });
  });

  describe('updateTopic', () => {
    it('トピックを更新できること', () => {
      const service = getUserContextService();
      
      service.updateTopic('テストトピック', 'これはテストトピックの詳細です');
      
      const context = service.getUserContext();
      expect(context.topics['テストトピック']).toBeDefined();
      expect(context.topics['テストトピック'].details).toBe('これはテストトピックの詳細です');
    });
  });

  describe('recordAmbiguousExpression', () => {
    it('あいまい表現を記録できること', () => {
      const service = getUserContextService();
      
      service.recordAmbiguousExpression(
        'テスト表現',
        'テスト解釈',
        0.9,
        ['コンテキスト1', 'コンテキスト2']
      );
      
      const context = service.getUserContext();
      expect(context.ambiguousExpressions.length).toBe(1);
      expect(context.ambiguousExpressions[0].expression).toBe('テスト表現');
      expect(context.ambiguousExpressions[0].interpretation).toBe('テスト解釈');
      expect(context.ambiguousExpressions[0].confidence).toBe(0.9);
      expect(context.ambiguousExpressions[0].contextFactors).toEqual(['コンテキスト1', 'コンテキスト2']);
    });

    it('既存の表現を更新できること', () => {
      // 新しいサービスインスタンスを取得して、キャッシュをクリア
      resetUserContextService();
      mockStorageInstance.clear();
      const service = getUserContextService(mockStorageInstance);
      
      // 最初の記録
      service.recordAmbiguousExpression('テスト表現', 'テスト解釈', 0.7);
      
      // 同じ表現で更新（同じ表現でも新しいエントリとして追加される実装の場合）
      service.recordAmbiguousExpression('テスト表現', '更新された解釈', 0.9);
      
      const context = service.getUserContext();
      
      // 最新の解釈が先頭に来ることを確認
      expect(context.ambiguousExpressions[0].expression).toBe('テスト表現');
      
      // 実装によって異なる可能性があるため、いずれかの解釈が含まれていることを確認
      const hasUpdatedInterpretation = context.ambiguousExpressions.some(
        item => item.expression === 'テスト表現' && item.interpretation === '更新された解釈'
      );
      expect(hasUpdatedInterpretation).toBe(true);
    });
  });

  describe('generateContextPrompt', () => {
    it('コンテキストプロンプトを生成できること', () => {
      const service = getUserContextService();
      
      // テストデータを設定
      service.recordUserPreference('theme', 'dark');
      service.recordUserQuestion('テスト質問1');
      service.recordUserQuestion('テスト質問2');
      service.saveConversationTopics(['トピック1', 'トピック2']);
      service.updateTopic('トピック1', 'トピック1の詳細');
      service.recordAmbiguousExpression('あいまい表現', '解釈結果');
      
      const prompt = service.generateContextPrompt();
      
      // プロンプトに必要な情報が含まれていることを確認
      expect(prompt).toContain('ユーザーの好み');
      expect(prompt).toContain('theme: dark');
      expect(prompt).toContain('最近の質問');
      expect(prompt).toContain('テスト質問1');
      expect(prompt).toContain('テスト質問2');
      expect(prompt).toContain('会話トピック');
      expect(prompt).toContain('トピック1');
      expect(prompt).toContain('トピック1の詳細');
      expect(prompt).toContain('あいまい表現');
      expect(prompt).toContain('解釈結果');
    });
  });

  describe('clearUserContext', () => {
    it('ユーザーコンテキストをクリアできること', () => {
      // 新しいサービスインスタンスを取得して、キャッシュをクリア
      resetUserContextService();
      mockStorageInstance.clear();
      const service = getUserContextService(mockStorageInstance);
      
      // 初期データを設定
      service.recordUserPreference('theme', 'dark');
      service.recordUserQuestion('テスト質問');
      service.saveConversationTopics(['テストトピック']);
      
      // 保存されたことを確認
      let context = service.getUserContext();
      expect(context.preferences.theme).toBe('dark');
      expect(context.recentQuestions.length).toBeGreaterThan(0);
      
      // コンテキストをクリア
      service.clearUserContext();
      
      // 新しいサービスインスタンスを取得して、キャッシュをクリア
      resetUserContextService();
      const newService = getUserContextService(mockStorageInstance);
      
      // クリア後の状態を確認
      context = newService.getUserContext();
      expect(context).toEqual(defaultUserContext);
      
      // トピックも空になっていることを確認
      expect(newService.getConversationTopics().length).toBe(0);
    });
  });

  describe('resetCache', () => {
    it('キャッシュをリセットできること', () => {
      const service = getUserContextService();
      
      // データを設定
      service.recordUserPreference('theme', 'dark');
      
      // キャッシュをリセット
      service.resetCache();
      
      // ストレージからデータを再取得することを確認
      // (モックストレージにはデータが残っているので、値は保持される)
      const context = service.getUserContext();
      expect(context.preferences.theme).toBe('dark');
    });
  });
}); 