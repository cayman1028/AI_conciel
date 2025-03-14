/**
 * ストレージサービスのインターフェース
 * localStorageなどのストレージAPIを抽象化
 */
export interface StorageService {
  /**
   * 指定されたキーに関連付けられた値を取得
   * @param key 取得する値のキー
   * @returns 値が存在する場合はその値、存在しない場合はnull
   */
  getItem(key: string): string | null;
  
  /**
   * 指定されたキーに値を保存
   * @param key 保存する値のキー
   * @param value 保存する値
   */
  setItem(key: string, value: string): void;
  
  /**
   * 指定されたキーとそれに関連付けられた値を削除
   * @param key 削除する値のキー
   */
  removeItem(key: string): void;
  
  /**
   * すべてのキーと値を削除
   */
  clear(): void;
}

/**
 * ローカルストレージを使用したストレージサービスの実装
 */
export class LocalStorageService implements StorageService {
  /**
   * 指定されたキーに関連付けられた値を取得
   * @param key 取得する値のキー
   * @returns 値が存在する場合はその値、存在しない場合はnull
   */
  getItem(key: string): string | null {
    if (typeof window === 'undefined') {
      return null; // サーバーサイドでは使用不可
    }
    return localStorage.getItem(key);
  }
  
  /**
   * 指定されたキーに値を保存
   * @param key 保存する値のキー
   * @param value 保存する値
   */
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') {
      return; // サーバーサイドでは使用不可
    }
    localStorage.setItem(key, value);
  }
  
  /**
   * 指定されたキーとそれに関連付けられた値を削除
   * @param key 削除する値のキー
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined') {
      return; // サーバーサイドでは使用不可
    }
    localStorage.removeItem(key);
  }
  
  /**
   * すべてのキーと値を削除
   */
  clear(): void {
    if (typeof window === 'undefined') {
      return; // サーバーサイドでは使用不可
    }
    localStorage.clear();
  }
}

/**
 * メモリ内ストレージを使用したストレージサービスの実装
 * テスト用や、localStorageが利用できない環境向け
 */
export class MemoryStorageService implements StorageService {
  private store: Record<string, string> = {};
  
  /**
   * 指定されたキーに関連付けられた値を取得
   * @param key 取得する値のキー
   * @returns 値が存在する場合はその値、存在しない場合はnull
   */
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  
  /**
   * 指定されたキーに値を保存
   * @param key 保存する値のキー
   * @param value 保存する値
   */
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  
  /**
   * 指定されたキーとそれに関連付けられた値を削除
   * @param key 削除する値のキー
   */
  removeItem(key: string): void {
    delete this.store[key];
  }
  
  /**
   * すべてのキーと値を削除
   */
  clear(): void {
    this.store = {};
  }
}

// デフォルトのストレージサービスインスタンス
let defaultStorageService: StorageService;

/**
 * デフォルトのストレージサービスを取得
 * 環境に応じて適切なストレージサービスを返す
 */
export function getStorageService(): StorageService {
  if (!defaultStorageService) {
    // ブラウザ環境ではLocalStorageService、それ以外ではMemoryStorageServiceを使用
    defaultStorageService = typeof window !== 'undefined' 
      ? new LocalStorageService() 
      : new MemoryStorageService();
  }
  return defaultStorageService;
}

/**
 * テスト用にストレージサービスをリセット
 */
export function resetStorageService(): void {
  if (defaultStorageService) {
    defaultStorageService.clear();
  }
}

/**
 * テスト用にカスタムストレージサービスを設定
 * @param service 設定するストレージサービス
 */
export function setStorageService(service: StorageService): void {
  defaultStorageService = service;
} 