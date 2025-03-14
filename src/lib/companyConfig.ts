/**
 * 法人設定管理ユーティリティ
 * 法人IDに基づいて適切な設定を読み込む機能を提供します
 */

import { defaultConfig } from '../companies/default/config';

// 設定の型定義
export interface CompanyConfig {
  name: string;
  greeting: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
  systemPrompt: string;
  apiSettings: {
    chatModel: string;
    ambiguousExpressionModel: string;
    topicExtractionModel: string;
    temperature: number;
    maxTokens: number;
  };
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  ui: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    borderRadius?: string;
    chatBubbleUserColor?: string;
    chatBubbleAssistantColor?: string;
    accentColor?: string;
    logoUrl?: string;
  };
  [key: string]: any; // インデックスシグネチャを追加して動的アクセスを許可
}

// 設定のキャッシュ（パフォーマンス向上のため）
const configCache: Record<string, CompanyConfig> = {
  // デフォルト設定を事前にキャッシュ
  'default': defaultConfig as CompanyConfig
};

// 設定のロード状態を追跡（並行リクエストの最適化）
const configLoadPromises: Record<string, Promise<CompanyConfig> | undefined> = {};

// 部分設定のキャッシュ（特定のセクションのみのキャッシュ）
const partialConfigCache: Record<string, Record<string, any>> = {};

/**
 * 法人IDに基づいて設定を取得する
 * @param companyId 法人ID（未指定の場合はデフォルト）
 * @returns 法人設定オブジェクト
 */
export async function getCompanyConfig(companyId: string = 'default'): Promise<CompanyConfig> {
  // キャッシュに存在する場合はキャッシュから即時返す
  if (configCache[companyId]) {
    return configCache[companyId];
  }

  // 既に同じ法人IDのロードが進行中の場合は、そのPromiseを返す（重複リクエスト防止）
  if (configLoadPromises[companyId]) {
    return configLoadPromises[companyId] as Promise<CompanyConfig>;
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
async function loadCompanyConfig(companyId: string): Promise<CompanyConfig> {
  try {
    // デフォルトの場合はキャッシュから返す
    if (companyId === 'default') {
      return defaultConfig as CompanyConfig;
    }

    // 法人固有の設定を動的にインポート
    const companyConfig = await import(`../companies/${companyId}/config`)
      .then(module => {
        const config = module.default || defaultConfig;
        // キャッシュに保存
        configCache[companyId] = config as CompanyConfig;
        return config as CompanyConfig;
      })
      .catch((error) => {
        console.warn(`法人ID "${companyId}" の設定が見つかりません。デフォルト設定を使用します。`, error);
        // エラー時もデフォルト設定をキャッシュ
        configCache[companyId] = defaultConfig as CompanyConfig;
        return defaultConfig as CompanyConfig;
      });

    return companyConfig;
  } catch (error) {
    console.error(`法人設定の読み込みエラー:`, error);
    // エラー時もデフォルト設定をキャッシュ
    configCache[companyId] = defaultConfig as CompanyConfig;
    return defaultConfig as CompanyConfig;
  }
}

/**
 * 法人設定の特定のセクションのみを取得する（パフォーマンス最適化）
 * @param companyId 法人ID
 * @param section 設定セクション名（例: 'apiSettings', 'greeting', 'ui'）
 * @returns 設定セクションオブジェクト
 */
export async function getCompanyConfigSection(companyId: string = 'default', section: keyof CompanyConfig): Promise<any> {
  // 部分キャッシュをチェック
  if (partialConfigCache[companyId]?.[section]) {
    return partialConfigCache[companyId][section];
  }
  
  try {
    // 完全な設定がキャッシュにある場合はそこから取得
    if (configCache[companyId]) {
      const sectionData = configCache[companyId][section] || (defaultConfig as CompanyConfig)[section];
      
      // 部分キャッシュに保存
      if (!partialConfigCache[companyId]) {
        partialConfigCache[companyId] = {};
      }
      partialConfigCache[companyId][section] = sectionData;
      
      return sectionData;
    }
    
    // デフォルトの場合は直接アクセス
    if (companyId === 'default') {
      return (defaultConfig as CompanyConfig)[section];
    }
    
    // 特定のセクションのみを動的にインポート（可能な場合）
    try {
      // 注: この方法は実際のプロジェクト構造によって異なる場合があります
      // 例えば、各セクションが別ファイルに分かれている場合など
      const sectionModule = await import(`../companies/${companyId}/sections/${section}`)
        .then(module => {
          const sectionData = module.default || (defaultConfig as CompanyConfig)[section];
          
          // 部分キャッシュに保存
          if (!partialConfigCache[companyId]) {
            partialConfigCache[companyId] = {};
          }
          partialConfigCache[companyId][section] = sectionData;
          
          return sectionData;
        })
        .catch(() => {
          // セクション別ファイルが見つからない場合は完全な設定を読み込む
          return getCompanyConfig(companyId).then(config => {
            const sectionData = config[section] || (defaultConfig as CompanyConfig)[section];
            
            // 部分キャッシュに保存
            if (!partialConfigCache[companyId]) {
              partialConfigCache[companyId] = {};
            }
            partialConfigCache[companyId][section] = sectionData;
            
            return sectionData;
          });
        });
      
      return sectionModule;
    } catch (error) {
      // エラー時は完全な設定から取得
      const config = await getCompanyConfig(companyId);
      return config[section] || (defaultConfig as CompanyConfig)[section];
    }
  } catch (error) {
    console.error(`設定セクションの取得エラー:`, error);
    return (defaultConfig as CompanyConfig)[section];
  }
}

/**
 * 法人設定の特定のプロパティを取得する（最も軽量な方法）
 * @param companyId 法人ID
 * @param path プロパティのパス（例: 'apiSettings.chatModel', 'ui.primaryColor'）
 * @param defaultValue デフォルト値
 * @returns プロパティ値
 */
export async function getCompanyConfigProperty<T>(
  companyId: string = 'default',
  path: string,
  defaultValue: T
): Promise<T> {
  try {
    // パスを分解
    const pathParts = path.split('.');
    const section = pathParts[0] as keyof CompanyConfig;
    
    // セクションが1つだけの場合（トップレベルプロパティ）
    if (pathParts.length === 1) {
      const config = await getCompanyConfig(companyId);
      return (config[section] as unknown as T) || defaultValue;
    }
    
    // セクションを取得
    const sectionData = await getCompanyConfigSection(companyId, section);
    if (!sectionData) {
      return defaultValue;
    }
    
    // セクション内のプロパティを取得
    let value = sectionData;
    for (let i = 1; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return defaultValue;
      }
    }
    
    return (value as unknown as T) || defaultValue;
  } catch (error) {
    console.error(`設定プロパティの取得エラー:`, error);
    return defaultValue;
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
    delete partialConfigCache[companyId];
    console.log(`法人ID "${companyId}" の設定キャッシュをクリアしました`);
  } else {
    // デフォルト設定は保持
    const defaultConfigCopy = configCache['default'];
    Object.keys(configCache).forEach(key => {
      delete configCache[key];
    });
    configCache['default'] = defaultConfigCopy;
    
    // 部分キャッシュもクリア
    Object.keys(partialConfigCache).forEach(key => {
      if (key !== 'default') {
        delete partialConfigCache[key];
      }
    });
    
    console.log('全ての設定キャッシュをクリアしました（デフォルト設定を除く）');
  }
} 