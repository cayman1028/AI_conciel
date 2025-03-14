/**
 * 法人応答テンプレート管理ユーティリティ
 * 法人IDに基づいて適切な応答テンプレートを読み込む機能を提供します
 */

import { defaultResponses } from '../companies/default/responses';

// 応答テンプレートのキャッシュ（パフォーマンス向上のため）
const responsesCache: Record<string, any> = {
  // デフォルト応答テンプレートを事前にキャッシュ
  'default': defaultResponses
};

// 応答テンプレートのロード状態を追跡（並行リクエストの最適化）
const responsesLoadPromises: Record<string, Promise<any> | undefined> = {};

/**
 * 法人IDに基づいて応答テンプレートを取得する
 * @param companyId 法人ID（未指定の場合はデフォルト）
 * @returns 法人応答テンプレートオブジェクト
 */
export async function getCompanyResponses(companyId: string = 'default') {
  // キャッシュに存在する場合はキャッシュから即時返す
  if (responsesCache[companyId]) {
    return responsesCache[companyId];
  }

  // 既に同じ法人IDのロードが進行中の場合は、そのPromiseを返す（重複リクエスト防止）
  if (responsesLoadPromises[companyId]) {
    return responsesLoadPromises[companyId];
  }

  // 新しいロードプロセスを開始
  const loadPromise = loadCompanyResponses(companyId);
  responsesLoadPromises[companyId] = loadPromise;
  
  try {
    const responses = await loadPromise;
    // ロードが完了したらプロミスを削除
    delete responsesLoadPromises[companyId];
    return responses;
  } catch (error) {
    // エラー時もプロミスを削除
    delete responsesLoadPromises[companyId];
    throw error;
  }
}

/**
 * 法人応答テンプレートを実際に読み込む内部関数
 * @param companyId 法人ID
 * @returns 応答テンプレートオブジェクト
 */
async function loadCompanyResponses(companyId: string): Promise<any> {
  try {
    // デフォルトの場合はキャッシュから返す
    if (companyId === 'default') {
      return defaultResponses;
    }

    // 法人固有の応答テンプレートを動的にインポート
    const companyResponses = await import(`../companies/${companyId}/responses`)
      .then(module => {
        const responses = module.default || defaultResponses;
        // キャッシュに保存
        responsesCache[companyId] = responses;
        return responses;
      })
      .catch((error) => {
        console.warn(`法人ID "${companyId}" の応答テンプレートが見つかりません。デフォルトテンプレートを使用します。`, error);
        // エラー時もデフォルトテンプレートをキャッシュ
        responsesCache[companyId] = defaultResponses;
        return defaultResponses;
      });

    return companyResponses;
  } catch (error) {
    console.error(`法人応答テンプレートの読み込みエラー:`, error);
    // エラー時もデフォルトテンプレートをキャッシュ
    responsesCache[companyId] = defaultResponses;
    return defaultResponses;
  }
}

/**
 * 特定のカテゴリとキーに基づいて応答テンプレートを取得する
 * @param companyId 法人ID
 * @param category カテゴリ（例: 'greeting', 'errors', 'faq'）
 * @param key キー（例: 'welcome', 'general', 'businessHours'）
 * @param fallbackText 応答が見つからない場合のフォールバックテキスト
 * @returns 応答テンプレートテキスト
 */
export async function getResponseTemplate(
  companyId: string = 'default',
  category: string,
  key: string,
  fallbackText: string = '情報が見つかりませんでした。'
): Promise<string> {
  try {
    const responses = await getCompanyResponses(companyId);
    
    // カテゴリとキーに基づいて応答を取得
    if (responses[category] && responses[category][key]) {
      return responses[category][key];
    }
    
    // デフォルトの応答を試す（法人固有の応答が見つからない場合）
    if (companyId !== 'default') {
      const defaultTemplates = await getCompanyResponses('default');
      if (defaultTemplates[category] && defaultTemplates[category][key]) {
        return defaultTemplates[category][key];
      }
    }
    
    // 応答が見つからない場合はフォールバックテキストを返す
    return fallbackText;
  } catch (error) {
    console.error(`応答テンプレートの取得エラー:`, error);
    return fallbackText;
  }
}

/**
 * 応答テンプレートを動的に更新する（開発環境用）
 * @param companyId 法人ID
 * @param category カテゴリ
 * @param key キー
 * @param text 新しいテキスト
 */
export function updateResponseTemplate(
  companyId: string,
  category: string,
  key: string,
  text: string
): void {
  // キャッシュから削除して再読み込みを強制
  delete responsesCache[companyId];
  
  // 注: 実際の実装では、データベースやAPIを使用して永続的に保存する必要があります
  console.log(`応答テンプレートを更新しました: ${companyId}.${category}.${key} = "${text}"`);
}

/**
 * 応答テンプレートキャッシュをクリアする（開発環境用）
 * @param companyId 特定の法人IDのキャッシュをクリアする場合は指定、未指定の場合は全てクリア
 */
export function clearResponsesCache(companyId?: string) {
  if (companyId) {
    delete responsesCache[companyId];
    console.log(`法人ID "${companyId}" の応答テンプレートキャッシュをクリアしました`);
  } else {
    // デフォルト応答テンプレートは保持
    const defaultResponsesCopy = responsesCache['default'];
    Object.keys(responsesCache).forEach(key => {
      delete responsesCache[key];
    });
    responsesCache['default'] = defaultResponsesCopy;
    console.log('全ての応答テンプレートキャッシュをクリアしました（デフォルトテンプレートを除く）');
  }
} 