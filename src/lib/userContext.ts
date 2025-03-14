// ユーザーコンテキスト管理
// 新しいUserContextServiceを使用するためのラッパー

import { StorageService } from './services/storageService';
import {
    AMBIGUOUS_EXPRESSIONS_KEY,
    AmbiguousExpression,
    CONVERSATION_TOPICS_KEY,
    defaultUserContext,
    getUserContextService,
    resetUserContextService as resetContextService,
    setUserContextService as setContextService,
    USER_CONTEXT_KEY,
    UserContext,
    UserContextService
} from './services/userContextService';

// 型定義をエクスポート
export { defaultUserContext, USER_CONTEXT_KEY };
export type {
    AmbiguousExpression,
    UserContext,
    UserContextService
};

// 定数をエクスポート
export const CONVERSATION_TOPICS_KEY_EXPORT = CONVERSATION_TOPICS_KEY;
export const AMBIGUOUS_EXPRESSIONS_KEY_EXPORT = AMBIGUOUS_EXPRESSIONS_KEY;

/**
 * UserContextServiceを作成する関数
 * 依存性注入パターンを使用して、テスト時にモックサービスを注入できるようにする
 * @param storageService ストレージサービス（省略可）
 * @returns UserContextServiceインスタンス
 */
export function createUserContextService(storageService?: StorageService): UserContextService {
  return getUserContextService(storageService);
}

/**
 * テスト用にUserContextServiceをリセットする関数
 */
export function resetUserContextService(): void {
  resetContextService();
}

/**
 * テスト用にカスタムUserContextServiceを設定する関数
 * @param service 設定するUserContextService
 */
export function setUserContextService(service: UserContextService): void {
  setContextService(service);
}

// ユーザーコンテキストの取得（キャッシュ対応）
export const getUserContext = (): UserContext => {
  return getUserContextService().getUserContext();
};

// ユーザーコンテキストの保存（スロットル処理）
export const saveUserContext = (context: UserContext): void => {
  getUserContextService().saveUserContext(context);
};

// 会話トピックの抽出（APIから返されるトピックを保存）
export const saveConversationTopics = (topics: string[]): void => {
  getUserContextService().saveConversationTopics(topics);
};

// 会話トピックの取得（キャッシュ対応）
export const getConversationTopics = (): string[] => {
  return getUserContextService().getConversationTopics();
};

// ユーザーの質問を記録
export const recordUserQuestion = (question: string): void => {
  getUserContextService().recordUserQuestion(question);
};

// トピックの更新
export const updateTopic = (topic: string, details: string): void => {
  getUserContextService().updateTopic(topic, details);
};

// ユーザーの好みを記録
export const recordUserPreference = (key: string, value: string | number | boolean): void => {
  getUserContextService().recordUserPreference(key, value);
};

// あいまい表現を記録
export const recordAmbiguousExpression = (
  expression: string,
  interpretation: string,
  confidence: number = 0.8,
  contextFactors: string[] = []
): void => {
  getUserContextService().recordAmbiguousExpression(
    expression,
    interpretation,
    confidence,
    contextFactors
  );
};

// コンテキストプロンプトの生成
export const generateContextPrompt = (): string => {
  return getUserContextService().generateContextPrompt();
};

// ユーザーコンテキストのクリア
export const clearUserContext = (): void => {
  getUserContextService().clearUserContext();
};

// キャッシュのリセット（テスト用）
export const resetCache = (): void => {
  getUserContextService().resetCache();
};

// サービス全体のリセット（テスト用）
export const resetAll = (): void => {
  resetContextService();
}; 