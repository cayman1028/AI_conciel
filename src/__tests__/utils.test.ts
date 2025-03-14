/**
 * ユーティリティ関数のテスト
 */

import {
    chunkArray,
    deepCopy,
    formatDate,
    getCurrentTimeOfDay,
    getTimeOfDay,
    mergeObjects,
    removeDuplicates,
    toCamelCase,
    truncateString
} from '../lib/utils';

describe('ユーティリティ関数', () => {
  describe('日付と時間の処理', () => {
    it('時間帯を正しく判定できること', () => {
      expect(getTimeOfDay(8)).toBe('morning');
      expect(getTimeOfDay(14)).toBe('afternoon');
      expect(getTimeOfDay(19)).toBe('evening');
      expect(getTimeOfDay(23)).toBe('night');
      expect(getTimeOfDay(3)).toBe('night');
    });
    
    it('現在の時間帯を取得できること', () => {
      // 現在の時間を取得
      const now = new Date();
      const hour = now.getHours();
      
      // 期待される時間帯
      let expectedTimeOfDay;
      if (hour >= 5 && hour < 12) expectedTimeOfDay = 'morning';
      else if (hour >= 12 && hour < 17) expectedTimeOfDay = 'afternoon';
      else if (hour >= 17 && hour < 22) expectedTimeOfDay = 'evening';
      else expectedTimeOfDay = 'night';
      
      expect(getCurrentTimeOfDay()).toBe(expectedTimeOfDay);
    });
    
    it('日付をフォーマットできること', () => {
      const testDate = new Date('2023-05-15T12:30:45');
      expect(formatDate(testDate)).toBe('2023-05-15');
    });
  });
  
  describe('文字列処理', () => {
    it('文字列を切り詰めることができること', () => {
      expect(truncateString('こんにちは、世界！', 5)).toBe('こんにちは...');
      expect(truncateString('Hello', 10)).toBe('Hello');
    });
    
    it('文字列をキャメルケースに変換できること', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
      expect(toCamelCase('user_name')).toBe('userName');
    });
  });
  
  describe('配列処理', () => {
    it('配列の重複を削除できること', () => {
      expect(removeDuplicates([1, 2, 2, 3, 4, 4, 5])).toEqual([1, 2, 3, 4, 5]);
      expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });
    
    it('配列をチャンクに分割できること', () => {
      expect(chunkArray([1, 2, 3, 4, 5, 6], 2)).toEqual([[1, 2], [3, 4], [5, 6]]);
      expect(chunkArray([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });
  });
  
  describe('オブジェクト処理', () => {
    it('オブジェクトの深いコピーを作成できること', () => {
      const original = { a: 1, b: { c: 2 } };
      const copy = deepCopy(original);
      
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      expect(copy.b).not.toBe(original.b);
    });
    
    it('オブジェクトをマージできること', () => {
      expect(mergeObjects({ a: 1, b: 2 }, { c: 3, d: 4 })).toEqual({ a: 1, b: 2, c: 3, d: 4 });
      expect(mergeObjects({ a: 1 }, { a: 2, b: 3 })).toEqual({ a: 2, b: 3 });
    });
  });
}); 