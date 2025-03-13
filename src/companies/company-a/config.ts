/**
 * 法人A用設定ファイル
 * デフォルト設定を継承して、法人A固有の設定を上書きします
 */

import { defaultConfig } from '../default/config';

export const companyAConfig = {
  ...defaultConfig,  // デフォルト設定を継承
  
  // 基本情報を上書き
  name: '株式会社A サポートセンター',
  
  // システムプロンプトを上書き
  systemPrompt: 'あなたは株式会社Aのカスタマーサポートアシスタントです。当社の製品やサービスに関する質問に丁寧に回答してください。専門的な内容でも分かりやすく説明することを心がけてください。時間帯に応じて適切な挨拶をしてください。朝（5時〜12時）は「おはようございます」、昼（12時〜17時）は「こんにちは」、夕方・夜（17時〜22時）は「こんばんは」、深夜（22時〜5時）は「お疲れ様です」と挨拶してください。',
  
  // UI設定を上書き
  ui: {
    ...defaultConfig.ui,  // デフォルトのUI設定を継承
    primaryColor: '#FF6B6B',  // 法人Aのブランドカラー
    secondaryColor: '#4ECDC4',
    chatBubbleUserColor: '#FFE66D',
    chatBubbleAssistantColor: '#F7FFF7'
  }
};

export default companyAConfig; 