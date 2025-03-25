import { describe, expect, it } from '@jest/globals';

describe('テスト環境', () => {
  it('Jestが正しく設定されていること', () => {
    // Jestグローバルオブジェクトが存在することを確認
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('テスト環境がDOMをサポートしていること', () => {
    // DOM操作が可能かチェック
    const element = document.createElement('div');
    element.innerHTML = '<span>テスト</span>';
    expect(element.firstChild?.textContent).toBe('テスト');
  });

  it('HTMLのスクロール関数が定義されていること', () => {
    // scrollIntoViewが定義されていることを確認
    expect(HTMLElement.prototype.scrollIntoView).toBeDefined();
    expect(typeof HTMLElement.prototype.scrollIntoView).toBe('function');
  });
}); 