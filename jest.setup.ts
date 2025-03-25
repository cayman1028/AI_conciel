/**
 * Jest用のセットアップファイル
 * テスト環境の追加設定を行います
 */

// @testing-library/jest-domをインポートしてDOM関連のマッチャーを追加
import '@testing-library/jest-dom';

// TypeScriptの型拡張定義
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toHaveValue(value: string | number | string[]): R;
    }
  }
}

// スクロール関数のモック化
// DOM操作のテストでスクロール機能が必要な場合に使用
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  configurable: true,
  value: function() { return; }
}); 