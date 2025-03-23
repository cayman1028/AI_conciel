import { ResponsePattern } from './types';

/**
 * ユーザー入力から最適な定型応答を検索する関数
 * @param userInput ユーザーの入力テキスト
 * @param responses 定型応答のパターン配列
 * @param defaultResponse どのパターンにも一致しない場合のデフォルト応答
 * @returns 最適な応答テキスト
 */
export function findBestResponse(
  userInput: string,
  responses: ResponsePattern[],
  defaultResponse: string
): string {
  // 入力が空の場合はデフォルト応答を返す
  if (!userInput.trim()) {
    return defaultResponse;
  }
  
  // 各パターンとのマッチングを試みる
  for (const pattern of responses) {
    // パターンのキーワードのいずれかが入力テキストに含まれているか確認
    for (const keyword of pattern.keywords) {
      if (userInput.toLowerCase().includes(keyword.toLowerCase())) {
        return pattern.response;
      }
    }
  }
  
  // どのパターンにもマッチしなかった場合はデフォルト応答を返す
  return defaultResponse;
} 