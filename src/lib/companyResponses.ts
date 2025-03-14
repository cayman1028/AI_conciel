/**
 * 法人別応答テンプレート管理ユーティリティ
 * 法人IDに基づいて適切な応答テンプレートを読み込む機能を提供します
 */

import { defaultResponses } from '../companies/default/responses';

// 応答テンプレートの型定義
export interface ResponseTemplate {
  [category: string]: {
    [key: string]: string;
  };
}

// 応答テンプレートのキャッシュ（パフォーマンス向上のため）
const responsesCache: Record<string, ResponseTemplate> = {
  // デフォルト応答テンプレートを事前にキャッシュ
  'default': defaultResponses as ResponseTemplate
};

// 応答テンプレートのロード状態を追跡（並行リクエストの最適化）
const responsesLoadPromises: Record<string, Promise<ResponseTemplate> | undefined> = {};

// カテゴリ別応答テンプレートのキャッシュ（特定のカテゴリのみのキャッシュ）
const categoryCache: Record<string, Record<string, any>> = {};

/**
 * 法人IDに基づいて応答テンプレートを取得する
 * @param companyId 法人ID（未指定の場合はデフォルト）
 * @returns 応答テンプレートオブジェクト
 */
export async function getCompanyResponses(companyId: string = 'default'): Promise<ResponseTemplate> {
  // キャッシュに存在する場合はキャッシュから即時返す
  if (responsesCache[companyId]) {
    return responsesCache[companyId];
  }

  // 既に同じ法人IDのロードが進行中の場合は、そのPromiseを返す（重複リクエスト防止）
  if (responsesLoadPromises[companyId]) {
    return responsesLoadPromises[companyId] as Promise<ResponseTemplate>;
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
async function loadCompanyResponses(companyId: string): Promise<ResponseTemplate> {
  try {
    // デフォルトの場合はキャッシュから返す
    if (companyId === 'default') {
      return defaultResponses as ResponseTemplate;
    }

    // 法人固有の応答テンプレートを動的にインポート
    const companyResponses = await import(`../companies/${companyId}/responses`)
      .then(module => {
        const responses = module.default || defaultResponses;
        // キャッシュに保存
        responsesCache[companyId] = responses as ResponseTemplate;
        return responses as ResponseTemplate;
      })
      .catch((error) => {
        console.warn(`法人ID "${companyId}" の応答テンプレートが見つかりません。デフォルトテンプレートを使用します。`, error);
        // エラー時もデフォルトテンプレートをキャッシュ
        responsesCache[companyId] = defaultResponses as ResponseTemplate;
        return defaultResponses as ResponseTemplate;
      });

    return companyResponses;
  } catch (error) {
    console.error(`応答テンプレートの読み込みエラー:`, error);
    // エラー時もデフォルトテンプレートをキャッシュ
    responsesCache[companyId] = defaultResponses as ResponseTemplate;
    return defaultResponses as ResponseTemplate;
  }
}

/**
 * 特定のカテゴリの応答テンプレートのみを取得する（パフォーマンス最適化）
 * @param companyId 法人ID
 * @param category カテゴリ名（例: 'greeting', 'error', 'confirmation'）
 * @returns カテゴリの応答テンプレート
 */
export async function getResponseCategory(
  companyId: string = 'default',
  category: string
): Promise<Record<string, string>> {
  // カテゴリキャッシュをチェック
  if (categoryCache[companyId]?.[category]) {
    return categoryCache[companyId][category];
  }
  
  try {
    // 完全な応答テンプレートがキャッシュにある場合はそこから取得
    if (responsesCache[companyId]) {
      const categoryData = responsesCache[companyId][category] || 
                          (defaultResponses as ResponseTemplate)[category] || 
                          {};
      
      // カテゴリキャッシュに保存
      if (!categoryCache[companyId]) {
        categoryCache[companyId] = {};
      }
      categoryCache[companyId][category] = categoryData;
      
      return categoryData;
    }
    
    // デフォルトの場合は直接アクセス
    if (companyId === 'default') {
      const categoryData = (defaultResponses as ResponseTemplate)[category] || {};
      
      // カテゴリキャッシュに保存
      if (!categoryCache['default']) {
        categoryCache['default'] = {};
      }
      categoryCache['default'][category] = categoryData;
      
      return categoryData;
    }
    
    // 特定のカテゴリのみを動的にインポート（可能な場合）
    try {
      // 注: この方法は実際のプロジェクト構造によって異なる場合があります
      const categoryModule = await import(`../companies/${companyId}/categories/${category}`)
        .then(module => {
          const categoryData = module.default || 
                              (defaultResponses as ResponseTemplate)[category] || 
                              {};
          
          // カテゴリキャッシュに保存
          if (!categoryCache[companyId]) {
            categoryCache[companyId] = {};
          }
          categoryCache[companyId][category] = categoryData;
          
          return categoryData;
        })
        .catch(() => {
          // カテゴリ別ファイルが見つからない場合は完全な応答テンプレートを読み込む
          return getCompanyResponses(companyId).then(responses => {
            const categoryData = responses[category] || 
                                (defaultResponses as ResponseTemplate)[category] || 
                                {};
            
            // カテゴリキャッシュに保存
            if (!categoryCache[companyId]) {
              categoryCache[companyId] = {};
            }
            categoryCache[companyId][category] = categoryData;
            
            return categoryData;
          });
        });
      
      return categoryModule;
    } catch (error) {
      // エラー時は完全な応答テンプレートから取得
      const responses = await getCompanyResponses(companyId);
      const categoryData = responses[category] || 
                          (defaultResponses as ResponseTemplate)[category] || 
                          {};
      
      // カテゴリキャッシュに保存
      if (!categoryCache[companyId]) {
        categoryCache[companyId] = {};
      }
      categoryCache[companyId][category] = categoryData;
      
      return categoryData;
    }
  } catch (error) {
    console.error(`応答カテゴリの取得エラー:`, error);
    return (defaultResponses as ResponseTemplate)[category] || {};
  }
}

/**
 * 応答テンプレートを取得する
 * @param companyId 法人ID
 * @param category カテゴリ
 * @param key テンプレートキー
 * @param fallbackText 見つからない場合のフォールバックテキスト
 * @returns テンプレートテキスト
 */
export async function getResponseTemplate(
  companyId: string = 'default',
  category: string,
  key: string,
  fallbackText: string = ''
): Promise<string> {
  try {
    // 最適化: カテゴリ単位で取得
    const categoryData = await getResponseCategory(companyId, category);
    
    // キーが存在する場合はそのテンプレートを返す
    if (categoryData && key in categoryData) {
      return categoryData[key];
    }
    
    // 法人固有のテンプレートが見つからない場合はデフォルトを試す
    if (companyId !== 'default') {
      const defaultCategoryData = await getResponseCategory('default', category);
      if (defaultCategoryData && key in defaultCategoryData) {
        return defaultCategoryData[key];
      }
    }
    
    // フォールバックテキストを返す
    return fallbackText;
  } catch (error) {
    console.error(`応答テンプレートの取得エラー:`, error);
    return fallbackText;
  }
}

/**
 * 応答テンプレートを更新する（開発環境用）
 * @param companyId 法人ID
 * @param category カテゴリ
 * @param key テンプレートキー
 * @param text 新しいテンプレートテキスト
 */
export async function updateResponseTemplate(
  companyId: string,
  category: string,
  key: string,
  text: string
): Promise<void> {
  try {
    // 応答テンプレートを取得
    const responses = await getCompanyResponses(companyId);
    
    // カテゴリが存在しない場合は作成
    if (!responses[category]) {
      responses[category] = {};
    }
    
    // テンプレートを更新
    responses[category][key] = text;
    
    // カテゴリキャッシュも更新
    if (categoryCache[companyId]?.[category]) {
      categoryCache[companyId][category][key] = text;
    }
    
    console.log(`応答テンプレートを更新しました: ${companyId}.${category}.${key}`);
  } catch (error) {
    console.error(`応答テンプレートの更新エラー:`, error);
    throw error;
  }
}

/**
 * 応答テンプレートキャッシュをクリアする（開発環境用）
 * @param companyId 特定の法人IDのキャッシュをクリアする場合は指定、未指定の場合は全てクリア
 */
export function clearResponsesCache(companyId?: string) {
  if (companyId) {
    delete responsesCache[companyId];
    delete categoryCache[companyId];
    console.log(`法人ID "${companyId}" の応答テンプレートキャッシュをクリアしました`);
  } else {
    // デフォルト応答テンプレートは保持
    const defaultResponsesCopy = responsesCache['default'];
    Object.keys(responsesCache).forEach(key => {
      delete responsesCache[key];
    });
    responsesCache['default'] = defaultResponsesCopy;
    
    // カテゴリキャッシュもクリア
    Object.keys(categoryCache).forEach(key => {
      if (key !== 'default') {
        delete categoryCache[key];
      }
    });
    
    console.log('全ての応答テンプレートキャッシュをクリアしました（デフォルトテンプレートを除く）');
  }
} 