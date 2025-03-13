/**
 * 法人設定管理ユーティリティ
 * 法人IDに基づいて適切な設定を読み込む機能を提供します
 */

import { defaultConfig } from '../companies/default/config';

// 設定のキャッシュ（パフォーマンス向上のため）
const configCache: Record<string, any> = {};

/**
 * 法人IDに基づいて設定を取得する
 * @param companyId 法人ID（未指定の場合はデフォルト）
 * @returns 法人設定オブジェクト
 */
export async function getCompanyConfig(companyId: string = 'default') {
  // キャッシュに存在する場合はキャッシュから返す
  if (configCache[companyId]) {
    return configCache[companyId];
  }

  try {
    // 法人IDに基づいて動的にモジュールをインポート
    if (companyId === 'default') {
      configCache[companyId] = defaultConfig;
      return defaultConfig;
    }

    // 法人固有の設定を動的にインポート
    const companyConfig = await import(`../companies/${companyId}/config`)
      .then(module => module.default || defaultConfig)
      .catch(() => {
        console.warn(`法人ID "${companyId}" の設定が見つかりません。デフォルト設定を使用します。`);
        return defaultConfig;
      });

    // キャッシュに保存
    configCache[companyId] = companyConfig;
    return companyConfig;
  } catch (error) {
    console.error(`法人設定の読み込みエラー:`, error);
    return defaultConfig;
  }
}

/**
 * 利用可能な法人IDのリストを取得する
 * 注: この関数はビルド時には動作せず、クライアントサイドでのみ使用可能
 */
export async function getAvailableCompanyIds(): Promise<string[]> {
  try {
    // 本番環境では実際の法人IDリストをAPIから取得するなどの実装が必要
    // 開発環境用の簡易実装
    return ['default', 'company-a', 'company-b', 'company-c'];
  } catch (error) {
    console.error('法人IDリストの取得に失敗しました:', error);
    return ['default'];
  }
}

/**
 * 現在のURLから法人IDを抽出する
 * URLパターン: https://example.com/[companyId]/...
 */
export function getCompanyIdFromUrl(): string {
  if (typeof window === 'undefined') return 'default';
  
  try {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    // URLの最初のセグメントが法人IDと仮定
    // 実際の実装ではより複雑なルーティングルールが必要かもしれません
    if (segments.length > 0) {
      const potentialCompanyId = segments[0];
      // 有効な法人IDかどうかの検証が必要
      // ここでは簡易的な実装
      return potentialCompanyId;
    }
  } catch (error) {
    console.error('URLからの法人ID抽出エラー:', error);
  }
  
  return 'default';
} 