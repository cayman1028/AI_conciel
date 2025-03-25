import '@jest/globals';
import { describe, expect, it } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Jest Setup', () => {
  // jest.setup.tsファイルの存在を確認
  it('jest.setup.tsファイルが存在すること', () => {
    const setupPath = path.resolve(__dirname, '../../jest.setup.ts');
    expect(fs.existsSync(setupPath)).toBe(true);
  });

  // セットアップ内容の検証
  it('jest.setup.tsがHTMLのスクロール関数をモックすること', () => {
    // setupファイルが自動的にロードされているはずなので、直接チェック
    expect(HTMLElement.prototype.scrollIntoView).toBeDefined();
    // カスタム関数に置き換えられていることを確認
    expect(typeof HTMLElement.prototype.scrollIntoView).toBe('function');
  });
}); 