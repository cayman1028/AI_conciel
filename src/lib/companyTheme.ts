/**
 * 法人テーマ管理ユーティリティ
 * 法人IDに基づいて適切なテーマを読み込む機能を提供します
 */

import { defaultTheme } from '../companies/default/theme';

// テーマの型定義
export interface CompanyTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
  };
  typography: {
    fontFamily: {
      base: string;
      heading: string;
      monospace: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      loose: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  borders: {
    radius: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      full: string;
    };
    width: {
      thin: string;
      medium: string;
      thick: string;
    };
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transitions: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    timing: {
      ease: string;
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
  chatWidget: {
    bubbleColors: {
      user: string;
      assistant: string;
    };
    inputHeight: string;
    maxHeight: string;
    width: string;
    mobileWidth: string;
    borderRadius: string;
    boxShadow: string;
  };
  [key: string]: any; // インデックスシグネチャを追加して動的アクセスを許可
}

// テーマのキャッシュ（パフォーマンス向上のため）
const themeCache: Record<string, CompanyTheme> = {
  // デフォルトテーマを事前にキャッシュ
  'default': defaultTheme as CompanyTheme
};

// テーマのロード状態を追跡（並行リクエストの最適化）
const themeLoadPromises: Record<string, Promise<CompanyTheme> | undefined> = {};

// テーマプロパティのキャッシュ（特定のプロパティのみのキャッシュ）
const themePropertyCache: Record<string, Record<string, any>> = {};

/**
 * 法人IDに基づいてテーマを取得する
 * @param companyId 法人ID（未指定の場合はデフォルト）
 * @returns 法人テーマオブジェクト
 */
export async function getCompanyTheme(companyId: string = 'default'): Promise<CompanyTheme> {
  // キャッシュに存在する場合はキャッシュから即時返す
  if (themeCache[companyId]) {
    return themeCache[companyId];
  }

  // 既に同じ法人IDのロードが進行中の場合は、そのPromiseを返す（重複リクエスト防止）
  if (themeLoadPromises[companyId]) {
    return themeLoadPromises[companyId] as Promise<CompanyTheme>;
  }

  // 新しいロードプロセスを開始
  const loadPromise = loadCompanyTheme(companyId);
  themeLoadPromises[companyId] = loadPromise;
  
  try {
    const theme = await loadPromise;
    // ロードが完了したらプロミスを削除
    delete themeLoadPromises[companyId];
    return theme;
  } catch (error) {
    // エラー時もプロミスを削除
    delete themeLoadPromises[companyId];
    throw error;
  }
}

/**
 * 法人テーマを実際に読み込む内部関数
 * @param companyId 法人ID
 * @returns テーマオブジェクト
 */
async function loadCompanyTheme(companyId: string): Promise<CompanyTheme> {
  try {
    // デフォルトの場合はキャッシュから返す
    if (companyId === 'default') {
      return defaultTheme as CompanyTheme;
    }

    // 法人固有のテーマを動的にインポート
    const companyTheme = await import(`../companies/${companyId}/theme`)
      .then(module => {
        const theme = module.default || defaultTheme;
        // キャッシュに保存
        themeCache[companyId] = theme as CompanyTheme;
        return theme as CompanyTheme;
      })
      .catch((error) => {
        console.warn(`法人ID "${companyId}" のテーマが見つかりません。デフォルトテーマを使用します。`, error);
        // エラー時もデフォルトテーマをキャッシュ
        themeCache[companyId] = defaultTheme as CompanyTheme;
        return defaultTheme as CompanyTheme;
      });

    return companyTheme;
  } catch (error) {
    console.error(`法人テーマの読み込みエラー:`, error);
    // エラー時もデフォルトテーマをキャッシュ
    themeCache[companyId] = defaultTheme as CompanyTheme;
    return defaultTheme as CompanyTheme;
  }
}

/**
 * 特定のテーマプロパティのみを取得する（最も軽量な方法）
 * @param companyId 法人ID
 * @param property プロパティパス（ドット区切り）
 * @param defaultValue デフォルト値
 * @returns プロパティ値
 */
export async function getThemeProperty<T>(
  companyId: string = 'default',
  property: string,
  defaultValue: T
): Promise<T> {
  // プロパティキャッシュをチェック
  if (themePropertyCache[companyId]?.[property]) {
    return themePropertyCache[companyId][property] as T;
  }
  
  try {
    // 完全なテーマがキャッシュにある場合はそこから取得
    if (themeCache[companyId]) {
      const propertyValue = getNestedProperty(themeCache[companyId], property, defaultValue);
      
      // プロパティキャッシュに保存
      if (!themePropertyCache[companyId]) {
        themePropertyCache[companyId] = {};
      }
      themePropertyCache[companyId][property] = propertyValue;
      
      return propertyValue;
    }
    
    // デフォルトの場合は直接アクセス
    if (companyId === 'default') {
      const propertyValue = getNestedProperty(defaultTheme as CompanyTheme, property, defaultValue);
      
      // プロパティキャッシュに保存
      if (!themePropertyCache['default']) {
        themePropertyCache['default'] = {};
      }
      themePropertyCache['default'][property] = propertyValue;
      
      return propertyValue;
    }
    
    // 特定のプロパティのみを動的にインポート（可能な場合）
    try {
      // 注: この方法は実際のプロジェクト構造によって異なる場合があります
      const propertyPath = property.replace(/\./g, '/');
      const propertyModule = await import(`../companies/${companyId}/themeProperties/${propertyPath}`)
        .then(module => {
          const propertyValue = module.default || 
                               getNestedProperty(defaultTheme as CompanyTheme, property, defaultValue);
          
          // プロパティキャッシュに保存
          if (!themePropertyCache[companyId]) {
            themePropertyCache[companyId] = {};
          }
          themePropertyCache[companyId][property] = propertyValue;
          
          return propertyValue;
        })
        .catch(() => {
          // プロパティ別ファイルが見つからない場合は完全なテーマを読み込む
          return getCompanyTheme(companyId).then(theme => {
            const propertyValue = getNestedProperty(theme, property, defaultValue);
            
            // プロパティキャッシュに保存
            if (!themePropertyCache[companyId]) {
              themePropertyCache[companyId] = {};
            }
            themePropertyCache[companyId][property] = propertyValue;
            
            return propertyValue;
          });
        });
      
      return propertyModule;
    } catch (error) {
      // エラー時は完全なテーマから取得
      const theme = await getCompanyTheme(companyId);
      const propertyValue = getNestedProperty(theme, property, defaultValue);
      
      // プロパティキャッシュに保存
      if (!themePropertyCache[companyId]) {
        themePropertyCache[companyId] = {};
      }
      themePropertyCache[companyId][property] = propertyValue;
      
      return propertyValue;
    }
  } catch (error) {
    console.error(`テーマプロパティの取得エラー:`, error);
    return defaultValue;
  }
}

/**
 * ネストされたオブジェクトからプロパティを取得するヘルパー関数
 * @param obj 対象オブジェクト
 * @param path プロパティパス（ドット区切り）
 * @param defaultValue デフォルト値
 * @returns プロパティ値
 */
function getNestedProperty<T>(obj: any, path: string, defaultValue: T): T {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return defaultValue;
    }
  }
  
  return (current as unknown as T) || defaultValue;
}

/**
 * テーマキャッシュをクリアする（開発環境用）
 * @param companyId 特定の法人IDのキャッシュをクリアする場合は指定、未指定の場合は全てクリア
 */
export function clearThemeCache(companyId?: string) {
  if (companyId) {
    delete themeCache[companyId];
    delete themePropertyCache[companyId];
    console.log(`法人ID "${companyId}" のテーマキャッシュをクリアしました`);
  } else {
    // デフォルトテーマは保持
    const defaultThemeCopy = themeCache['default'];
    Object.keys(themeCache).forEach(key => {
      delete themeCache[key];
    });
    themeCache['default'] = defaultThemeCopy;
    
    // プロパティキャッシュもクリア
    Object.keys(themePropertyCache).forEach(key => {
      if (key !== 'default') {
        delete themePropertyCache[key];
      }
    });
    
    console.log('全てのテーマキャッシュをクリアしました（デフォルトテーマを除く）');
  }
}

/**
 * CSSカスタムプロパティとしてテーマを適用する
 * @param companyId 法人ID
 * @param element 適用する要素（デフォルトはdocument.documentElement）
 */
export async function applyThemeToElement(
  companyId: string = 'default',
  element: HTMLElement = document.documentElement
): Promise<void> {
  try {
    const theme = await getCompanyTheme(companyId);
    
    // テーマのプロパティをCSSカスタムプロパティとして適用
    // 主要なプロパティを直接設定
    element.style.setProperty('--theme-primary-color', theme.colors.primary);
    element.style.setProperty('--theme-secondary-color', theme.colors.secondary);
    element.style.setProperty('--theme-accent-color', theme.colors.accent);
    element.style.setProperty('--theme-background-color', theme.colors.background);
    element.style.setProperty('--theme-surface-color', theme.colors.surface);
    element.style.setProperty('--theme-text-color', theme.colors.text.primary);
    element.style.setProperty('--theme-font-family', theme.typography.fontFamily.base);
    
    // チャットウィジェット固有の設定
    element.style.setProperty('--theme-chat-user-bubble', theme.chatWidget.bubbleColors.user);
    element.style.setProperty('--theme-chat-assistant-bubble', theme.chatWidget.bubbleColors.assistant);
    element.style.setProperty('--theme-chat-border-radius', theme.chatWidget.borderRadius);
    element.style.setProperty('--theme-chat-box-shadow', theme.chatWidget.boxShadow);
    
    // テーマが適用されたことを示す属性を設定
    element.setAttribute('data-theme', companyId);
    
    console.log(`法人ID "${companyId}" のテーマを適用しました`);
  } catch (error) {
    console.error(`テーマの適用エラー:`, error);
  }
}

/**
 * テーマからCSSプロパティを生成する
 * @param theme テーマオブジェクト
 * @returns CSSプロパティオブジェクト
 */
export function generateThemeStyles(theme: any) {
  return {
    // チャットボタン
    chatButtonStyle: {
      backgroundColor: theme.colors.primary,
      boxShadow: `0 4px 12px ${theme.colors.primary}40`,
    },
    
    // チャットヘッダー
    chatHeaderStyle: {
      backgroundColor: theme.colors.primary,
    },
    
    // ユーザーメッセージ
    userMessageStyle: {
      backgroundColor: theme.colors.primary,
      color: theme.colors.text.inverse,
    },
    
    // ボットメッセージ
    botMessageStyle: {
      backgroundColor: theme.chatWidget?.bubbleColors?.assistant || theme.colors.surface,
      color: theme.colors.text.primary,
    },
    
    // 送信ボタン
    sendButtonStyle: {
      backgroundColor: theme.colors.primary,
    },
    
    // 送信ボタン（ホバー時）
    sendButtonHoverStyle: {
      backgroundColor: theme.colors.secondary,
    }
  };
}

/**
 * CSSカスタムプロパティを生成する
 * @param theme テーマオブジェクト
 * @returns CSSカスタムプロパティの文字列
 */
export function generateCssVariables(theme: any) {
  return `
    --primary-color: ${theme.colors.primary};
    --secondary-color: ${theme.colors.secondary};
    --accent-color: ${theme.colors.accent};
    --background-color: ${theme.colors.background};
    --surface-color: ${theme.colors.surface};
    --text-primary-color: ${theme.colors.text.primary};
    --text-secondary-color: ${theme.colors.text.secondary};
    --text-disabled-color: ${theme.colors.text.disabled};
    --text-inverse-color: ${theme.colors.text.inverse};
    --success-color: ${theme.colors.status.success};
    --warning-color: ${theme.colors.status.warning};
    --error-color: ${theme.colors.status.error};
    --info-color: ${theme.colors.status.info};
    --border-radius: ${theme.borders.radius.md};
    --chat-bubble-user-color: ${theme.chatWidget?.bubbleColors?.user || theme.colors.primary};
    --chat-bubble-assistant-color: ${theme.chatWidget?.bubbleColors?.assistant || theme.colors.surface};
  `;
}

/**
 * CSSの変数としてテーマを適用する
 * @param companyId 法人ID
 * @param targetElement 適用対象の要素（デフォルトはdocument.documentElement）
 */
export async function applyCompanyTheme(
  companyId: string = 'default',
  targetElement: HTMLElement = document.documentElement
) {
  try {
    const theme = await getCompanyTheme(companyId);
    
    // カラー変数の適用
    targetElement.style.setProperty('--color-primary', theme.colors.primary);
    targetElement.style.setProperty('--color-secondary', theme.colors.secondary);
    targetElement.style.setProperty('--color-accent', theme.colors.accent);
    targetElement.style.setProperty('--color-background', theme.colors.background);
    targetElement.style.setProperty('--color-surface', theme.colors.surface);
    targetElement.style.setProperty('--color-text-primary', theme.colors.text.primary);
    targetElement.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
    
    // フォント変数の適用
    targetElement.style.setProperty('--font-family-base', theme.typography.fontFamily.base);
    targetElement.style.setProperty('--font-family-heading', theme.typography.fontFamily.heading);
    
    // ボーダー変数の適用
    targetElement.style.setProperty('--border-radius-md', theme.borders.radius.md);
    targetElement.style.setProperty('--border-radius-lg', theme.borders.radius.lg);
    
    // チャットウィジェット変数の適用
    targetElement.style.setProperty('--chat-bubble-user', theme.chatWidget.bubbleColors.user);
    targetElement.style.setProperty('--chat-bubble-assistant', theme.chatWidget.bubbleColors.assistant);
    targetElement.style.setProperty('--chat-border-radius', theme.chatWidget.borderRadius);
    targetElement.style.setProperty('--chat-box-shadow', theme.chatWidget.boxShadow);
    
    console.log(`法人 "${companyId}" のテーマを適用しました`);
  } catch (error) {
    console.error(`テーマの適用エラー:`, error);
  }
} 