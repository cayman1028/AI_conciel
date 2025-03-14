/**
 * 法人設定管理ユーティリティ
 * 法人IDに基づいて適切な設定を読み込む機能を提供します
 */

import { defaultConfig } from '../companies/default/config';

// 設定のキャッシュ（パフォーマンス向上のため）
const configCache: Record<string, any> = {
  // デフォルト設定を事前にキャッシュ
  'default': defaultConfig
};

// 設定のロード状態を追跡（並行リクエストの最適化）
const configLoadPromises: Record<string, Promise<any> | undefined> = {};

/**
 * 法人IDに基づいて設定を取得する
 * @param companyId 法人ID（未指定の場合はデフォルト）
 * @returns 法人設定オブジェクト
 */
export async function getCompanyConfig(companyId: string = 'default') {
  // キャッシュに存在する場合はキャッシュから即時返す
  if (configCache[companyId]) {
    return configCache[companyId];
  }

  // 既に同じ法人IDのロードが進行中の場合は、そのPromiseを返す（重複リクエスト防止）
  if (configLoadPromises[companyId]) {
    return configLoadPromises[companyId];
  }

  // 新しいロードプロセスを開始
  const loadPromise = loadCompanyConfig(companyId);
  configLoadPromises[companyId] = loadPromise;
  
  try {
    const config = await loadPromise;
    // ロードが完了したらプロミスを削除
    delete configLoadPromises[companyId];
    return config;
  } catch (error) {
    // エラー時もプロミスを削除
    delete configLoadPromises[companyId];
    throw error;
  }
}

/**
 * 法人設定を実際に読み込む内部関数
 * @param companyId 法人ID
 * @returns 設定オブジェクト
 */
async function loadCompanyConfig(companyId: string): Promise<any> {
  try {
    // デフォルトの場合はキャッシュから返す
    if (companyId === 'default') {
      return defaultConfig;
    }

    // 法人固有の設定を動的にインポート
    const companyConfig = await import(`../companies/${companyId}/config`)
      .then(module => {
        const config = module.default || defaultConfig;
        // キャッシュに保存
        configCache[companyId] = config;
        return config;
      })
      .catch((error) => {
        console.warn(`法人ID "${companyId}" の設定が見つかりません。デフォルト設定を使用します。`, error);
        // エラー時もデフォルト設定をキャッシュ
        configCache[companyId] = defaultConfig;
        return defaultConfig;
      });

    return companyConfig;
  } catch (error) {
    console.error(`法人設定の読み込みエラー:`, error);
    // エラー時もデフォルト設定をキャッシュ
    configCache[companyId] = defaultConfig;
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

/**
 * 設定キャッシュをクリアする（開発環境用）
 * @param companyId 特定の法人IDのキャッシュをクリアする場合は指定、未指定の場合は全てクリア
 */
export function clearConfigCache(companyId?: string) {
  if (companyId) {
    delete configCache[companyId];
    console.log(`法人ID "${companyId}" の設定キャッシュをクリアしました`);
  } else {
    // デフォルト設定は保持
    const defaultConfigCopy = configCache['default'];
    Object.keys(configCache).forEach(key => {
      delete configCache[key];
    });
    configCache['default'] = defaultConfigCopy;
    console.log('全ての設定キャッシュをクリアしました（デフォルト設定を除く）');
  }
} 