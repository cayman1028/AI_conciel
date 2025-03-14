/**
 * 単純なテスト
 * このテストは基本的なJestの機能をテストします
 */

describe('基本的な機能テスト', () => {
  // 最も単純なテスト
  test('trueはtrueであること', () => {
    expect(true).toBe(true);
  });

  test('数値の計算が正しく行われること', () => {
    expect(1 + 1).toBe(2);
    expect(5 - 2).toBe(3);
    expect(2 * 3).toBe(6);
    expect(10 / 2).toBe(5);
  });

  test('文字列の操作が正しく行われること', () => {
    expect('Hello' + ' ' + 'World').toBe('Hello World');
    expect('Hello World'.split(' ')).toEqual(['Hello', 'World']);
    expect('Hello World'.includes('World')).toBe(true);
    expect('Hello World'.startsWith('Hello')).toBe(true);
  });

  it('配列の操作が正しく行われること', () => {
    const array = [1, 2, 3];
    expect(array.length).toBe(3);
    expect(array.map(x => x * 2)).toEqual([2, 4, 6]);
    expect(array.filter(x => x > 1)).toEqual([2, 3]);
    expect(array.reduce((acc, x) => acc + x, 0)).toBe(6);
  });

  it('オブジェクトの操作が正しく行われること', () => {
    const obj = { a: 1, b: 2, c: 3 };
    expect(Object.keys(obj)).toEqual(['a', 'b', 'c']);
    expect(Object.values(obj)).toEqual([1, 2, 3]);
    expect({ ...obj, d: 4 }).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });

  it('非同期処理が正しく行われること', async () => {
    const promise = Promise.resolve(42);
    await expect(promise).resolves.toBe(42);

    const asyncFunc = async () => {
      return 'success';
    };
    const result = await asyncFunc();
    expect(result).toBe('success');
  });
}); 