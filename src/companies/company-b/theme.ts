/**
 * 法人B用のテーマ設定
 * デフォルトのテーマを継承して、法人B固有のデザインテーマを定義します
 */

import { defaultTheme } from '../default/theme';

export const companyBTheme = {
  ...defaultTheme,  // デフォルトのテーマを継承
  
  // カラーパレットを上書き
  colors: {
    ...defaultTheme.colors,
    primary: '#3498db',  // 法人Bのブランドカラー（青）
    secondary: '#2ecc71',  // 緑
    accent: '#9b59b6',  // 紫
    background: '#f8f9fa',
    surface: '#ffffff',
    text: {
      ...defaultTheme.colors.text,
      primary: '#2c3e50',
      secondary: '#7f8c8d'
    },
    status: {
      ...defaultTheme.colors.status,
      success: '#27ae60',
      warning: '#f39c12',
      error: '#e74c3c',
      info: '#3498db'
    }
  },
  
  // タイポグラフィを上書き
  typography: {
    ...defaultTheme.typography,
    fontFamily: {
      ...defaultTheme.typography.fontFamily,
      base: '"Roboto", "Noto Sans JP", sans-serif',
      heading: '"Roboto", "Noto Sans JP", sans-serif',
      monospace: '"Source Code Pro", monospace'
    },
    fontSize: {
      ...defaultTheme.typography.fontSize,
      md: '1.05rem',  // 少し大きめのフォントサイズ
      lg: '1.2rem'
    }
  },
  
  // ボーダーを上書き
  borders: {
    ...defaultTheme.borders,
    radius: {
      ...defaultTheme.borders.radius,
      sm: '0.25rem',  // より丸みを帯びたデザイン
      md: '0.5rem',
      lg: '0.75rem'
    }
  },
  
  // シャドウを上書き
  shadows: {
    ...defaultTheme.shadows,
    md: '0 4px 8px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.1)'
  },
  
  // チャットウィジェット固有の設定を上書き
  chatWidget: {
    ...defaultTheme.chatWidget,
    bubbleColors: {
      user: '#ebf5fb',  // 薄い青
      assistant: '#eafaf1'  // 薄い緑
    },
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
    width: '380px',  // 少し広めのウィジェット
    maxHeight: '650px'  // 少し高めのウィジェット
  }
};

export default companyBTheme; 