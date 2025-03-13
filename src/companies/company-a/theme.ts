/**
 * 法人A用のテーマ設定
 * デフォルトのテーマを継承して、法人A固有のデザインテーマを定義します
 */

import { defaultTheme } from '../default/theme';

export const companyATheme = {
  ...defaultTheme,  // デフォルトのテーマを継承
  
  // カラーパレットを上書き
  colors: {
    ...defaultTheme.colors,
    primary: '#FF6B6B',  // 法人Aのブランドカラー
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    background: '#F7FFF7',
    text: {
      ...defaultTheme.colors.text,
      primary: '#2F4858',
      secondary: '#5E6572'
    },
    status: {
      ...defaultTheme.colors.status,
      success: '#2EC4B6',
      warning: '#FF9F1C'
    }
  },
  
  // タイポグラフィを上書き
  typography: {
    ...defaultTheme.typography,
    fontFamily: {
      ...defaultTheme.typography.fontFamily,
      base: '"Noto Sans JP", sans-serif',
      heading: '"Noto Sans JP", sans-serif'
    }
  },
  
  // ボーダーを上書き
  borders: {
    ...defaultTheme.borders,
    radius: {
      ...defaultTheme.borders.radius,
      md: '0.5rem',  // より丸みを帯びたデザイン
      lg: '0.75rem'
    }
  },
  
  // チャットウィジェット固有の設定を上書き
  chatWidget: {
    ...defaultTheme.chatWidget,
    bubbleColors: {
      user: '#FFE66D',  // 法人Aのブランドカラーに合わせた吹き出し色
      assistant: '#F7FFF7'
    },
    borderRadius: '12px',  // より丸みを帯びたウィジェット
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
  }
};

export default companyATheme; 