/**
 * 法人テーマ管理ユーティリティ
 * 法人IDに基づいて適切なテーマ設定を読み込む機能を提供します
 */

import { defaultTheme } from '../companies/default/theme';

// テーマのキャッシュ（パフォーマンス向上のため）
const themeCache: Record<string, any> = {};

/**
 * 法人IDに基づいてテーマを取得する
 * @param companyId 法人ID（未指定の場合はデフォルト）
 * @returns 法人テーマオブジェクト
 */
export async function getCompanyTheme(companyId: string = 'default') {
  // キャッシュに存在する場合はキャッシュから返す
  if (themeCache[companyId]) {
    return themeCache[companyId];
  }

  try {
    // 法人IDに基づいて動的にモジュールをインポート
    if (companyId === 'default') {
      themeCache[companyId] = defaultTheme;
      return defaultTheme;
    }

    // 法人固有のテーマを動的にインポート
    const companyTheme = await import(`../companies/${companyId}/theme`)
      .then(module => module.default || defaultTheme)
      .catch(() => {
        console.warn(`法人ID "${companyId}" のテーマが見つかりません。デフォルトテーマを使用します。`);
        return defaultTheme;
      });

    // キャッシュに保存
    themeCache[companyId] = companyTheme;
    return companyTheme;
  } catch (error) {
    console.error(`法人テーマの読み込みエラー:`, error);
    return defaultTheme;
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

/**
 * 現在適用されているテーマの特定のプロパティを取得する
 * @param companyId 法人ID
 * @param path プロパティのパス（例: 'colors.primary', 'typography.fontFamily.base'）
 * @param defaultValue デフォルト値
 * @returns プロパティの値
 */
export async function getThemeProperty(
  companyId: string = 'default',
  path: string,
  defaultValue: any = null
): Promise<any> {
  try {
    const theme = await getCompanyTheme(companyId);
    
    // パスに基づいてプロパティを取得
    const pathParts = path.split('.');
    let value = theme;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  } catch (error) {
    console.error(`テーマプロパティの取得エラー:`, error);
    return defaultValue;
  }
} 