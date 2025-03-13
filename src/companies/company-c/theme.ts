/**
 * 法人C用のテーマ設定
 * デフォルトのテーマを継承して、法人C固有のデザインテーマを定義します
 */

import { defaultTheme } from '../default/theme';

export const companyCTheme = {
  ...defaultTheme,  // デフォルトのテーマを継承
  
  // カラーパレットを上書き
  colors: {
    ...defaultTheme.colors,
    primary: '#e74c3c',  // 法人Cのブランドカラー（赤）
    secondary: '#3498db',  // 青
    accent: '#f1c40f',  // 黄色
    background: '#f9f9f9',
    surface: '#ffffff',
    text: {
      ...defaultTheme.colors.text,
      primary: '#34495e',
      secondary: '#7f8c8d'
    },
    status: {
      ...defaultTheme.colors.status,
      success: '#2ecc71',
      warning: '#f39c12',
      error: '#c0392b',
      info: '#3498db'
    }
  },
  
  // タイポグラフィを上書き
  typography: {
    ...defaultTheme.typography,
    fontFamily: {
      ...defaultTheme.typography.fontFamily,
      base: '"Hiragino Sans", "Meiryo", sans-serif',
      heading: '"Hiragino Sans", "Meiryo", sans-serif',
      monospace: '"Courier New", monospace'
    },
    fontSize: {
      ...defaultTheme.typography.fontSize,
      md: '1rem',
      lg: '1.15rem'
    },
    fontWeight: {
      ...defaultTheme.typography.fontWeight,
      normal: 400,
      bold: 600  // やや軽めの太字
    }
  },
  
  // ボーダーを上書き
  borders: {
    ...defaultTheme.borders,
    radius: {
      ...defaultTheme.borders.radius,
      sm: '4px',
      md: '6px',
      lg: '8px'
    }
  },
  
  // シャドウを上書き
  shadows: {
    ...defaultTheme.shadows,
    sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)'
  },
  
  // トランジションを上書き
  transitions: {
    ...defaultTheme.transitions,
    duration: {
      ...defaultTheme.transitions.duration,
      fast: '200ms',  // やや遅めのトランジション
      normal: '350ms'
    }
  },
  
  // チャットウィジェット固有の設定を上書き
  chatWidget: {
    ...defaultTheme.chatWidget,
    bubbleColors: {
      user: '#fadbd8',  // 薄い赤
      assistant: '#ebf5fb'  // 薄い青
    },
    borderRadius: '8px',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
    width: '360px',
    maxHeight: '600px',
    inputHeight: '65px'  // 入力欄を少し高く
  }
};

export default companyCTheme; 