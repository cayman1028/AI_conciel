import {
    LocalStorageService,
    MemoryStorageService,
    StorageService,
    getStorageService,
    resetStorageService,
    setStorageService
} from '../../../lib/services/storageService';

describe('StorageService', () => {
  // 各テスト後にストレージをクリア
  afterEach(() => {
    localStorage.clear();
    resetStorageService();
  });

  describe('LocalStorageService', () => {
    let service: StorageService;

    beforeEach(() => {
      service = new LocalStorageService();
    });

    it('値を保存して取得できること', () => {
      service.setItem('test-key', 'test-value');
      expect(service.getItem('test-key')).toBe('test-value');
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('存在しないキーに対してnullを返すこと', () => {
      expect(service.getItem('non-existent')).toBeNull();
    });

    it('値を削除できること', () => {
      service.setItem('test-key', 'test-value');
      service.removeItem('test-key');
      expect(service.getItem('test-key')).toBeNull();
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('すべての値をクリアできること', () => {
      service.setItem('key1', 'value1');
      service.setItem('key2', 'value2');
      service.clear();
      expect(service.getItem('key1')).toBeNull();
      expect(service.getItem('key2')).toBeNull();
      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
    });

    it('windowが未定義の場合に適切に処理すること', () => {
      // windowオブジェクトを一時的に保存
      const originalWindow = global.window;
      
      // windowをundefinedに設定
      // @ts-ignore
      delete global.window;
      
      // 各メソッドが例外を投げないことを確認
      expect(() => service.getItem('test')).not.toThrow();
      expect(() => service.setItem('test', 'value')).not.toThrow();
      expect(() => service.removeItem('test')).not.toThrow();
      expect(() => service.clear()).not.toThrow();
      
      // windowオブジェクトを復元
      global.window = originalWindow;
    });
  });

  describe('MemoryStorageService', () => {
    let service: StorageService;

    beforeEach(() => {
      service = new MemoryStorageService();
    });

    it('値を保存して取得できること', () => {
      service.setItem('test-key', 'test-value');
      expect(service.getItem('test-key')).toBe('test-value');
      // localStorageには影響しないことを確認
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('存在しないキーに対してnullを返すこと', () => {
      expect(service.getItem('non-existent')).toBeNull();
    });

    it('値を削除できること', () => {
      service.setItem('test-key', 'test-value');
      service.removeItem('test-key');
      expect(service.getItem('test-key')).toBeNull();
    });

    it('すべての値をクリアできること', () => {
      service.setItem('key1', 'value1');
      service.setItem('key2', 'value2');
      service.clear();
      expect(service.getItem('key1')).toBeNull();
      expect(service.getItem('key2')).toBeNull();
    });
  });

  describe('getStorageService', () => {
    it('ブラウザ環境ではLocalStorageServiceを返すこと', () => {
      const service = getStorageService();
      // 実装クラスの確認
      expect(service).toBeInstanceOf(LocalStorageService);
      
      // 機能テスト
      service.setItem('test-key', 'test-value');
      expect(service.getItem('test-key')).toBe('test-value');
      expect(localStorage.getItem('test-key')).toBe('test-value');
    });

    it('windowが未定義の場合はMemoryStorageServiceを返すこと', () => {
      // windowオブジェクトを保存
      const originalWindow = global.window;
      
      // windowオブジェクトを削除
      // @ts-ignore
      delete global.window;
      
      // 既存のサービスをリセット
      resetStorageService();
      
      // 強制的にdefaultStorageServiceをnullにする
      // @ts-ignore
      setStorageService(null);
      
      const service = getStorageService();
      
      // MemoryStorageServiceのインスタンスであることを確認
      expect(service).toBeInstanceOf(MemoryStorageService);
      
      // 機能テスト
      service.setItem('test-key', 'test-value');
      expect(service.getItem('test-key')).toBe('test-value');
      
      // windowオブジェクトを復元
      global.window = originalWindow;
    });

    it('同じインスタンスを返すこと', () => {
      const service1 = getStorageService();
      const service2 = getStorageService();
      expect(service1).toBe(service2);
    });
  });

  describe('setStorageService', () => {
    it('カスタムストレージサービスを設定できること', () => {
      const customService = new MemoryStorageService();
      setStorageService(customService);
      
      const service = getStorageService();
      expect(service).toBe(customService);
      
      // 機能テスト
      service.setItem('test-key', 'test-value');
      expect(service.getItem('test-key')).toBe('test-value');
      // localStorageには影響しないことを確認
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });
}); 