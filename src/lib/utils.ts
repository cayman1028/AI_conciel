/**
 * ユーティリティ関数ライブラリ
 * アプリケーション全体で使用される共通の関数を提供します
 */

/**
 * 時間帯を判定する関数
 * @param hour 時間（0-23）
 * @returns 時間帯の文字列（'morning', 'afternoon', 'evening', 'night'）
 */
export const getTimeOfDay = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
};

/**
 * 現在の時間帯を取得する関数
 * @returns 現在の時間帯の文字列
 */
export const getCurrentTimeOfDay = (): string => {
  const now = new Date();
  return getTimeOfDay(now.getHours());
};

/**
 * 日付をフォーマットする関数
 * @param date 日付オブジェクト
 * @returns YYYY-MM-DD形式の文字列
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * 文字列を指定の長さで切り詰める関数
 * @param str 対象の文字列
 * @param maxLength 最大長
 * @returns 切り詰められた文字列
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

/**
 * 文字列をキャメルケースに変換する関数
 * @param str 対象の文字列
 * @returns キャメルケースに変換された文字列
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/[-_]([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * 配列から重複を削除する関数
 * @param array 対象の配列
 * @returns 重複が削除された配列
 */
export const removeDuplicates = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * 配列を指定サイズのチャンクに分割する関数
 * @param array 対象の配列
 * @param size チャンクサイズ
 * @returns チャンクの配列
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

/**
 * オブジェクトの深いコピーを作成する関数
 * @param obj 対象のオブジェクト
 * @returns コピーされたオブジェクト
 */
export const deepCopy = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 2つのオブジェクトをマージする関数
 * @param obj1 1つ目のオブジェクト
 * @param obj2 2つ目のオブジェクト
 * @returns マージされたオブジェクト
 */
export const mergeObjects = <T extends object, U extends object>(obj1: T, obj2: U): T & U => {
  return { ...obj1, ...obj2 };
}; 