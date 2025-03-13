/**
 * 法人C用設定ファイル
 * デフォルト設定を継承して、法人C固有の設定を上書きします
 */

import { defaultConfig } from '../default/config';

export const companyCConfig = {
  ...defaultConfig,  // デフォルト設定を継承
  
  // 基本情報を上書き
  name: '株式会社C ヘルプデスク',
  
  // システムプロンプトを上書き
  systemPrompt: 'あなたは株式会社Cのヘルプデスクアシスタントです。当社の健康・医療サービスに関する質問に丁寧に回答してください。医療情報は正確かつ分かりやすく説明し、必要に応じて専門家への相談を促してください。時間帯に応じて適切な挨拶をしてください。朝（5時〜12時）は「おはようございます」、昼（12時〜17時）は「こんにちは」、夕方・夜（17時〜22時）は「こんばんは」、深夜（22時〜5時）は「お疲れ様です」と挨拶してください。',
  
  // 挨拶メッセージを上書き
  greeting: {
    ...defaultConfig.greeting,
    morning: 'おはようございます！株式会社Cのヘルプデスクへようこそ。健康的な一日のスタートをサポートします。何かお手伝いできることはありますか？',
    afternoon: 'こんにちは！株式会社Cのヘルプデスクへようこそ。健康・医療に関するご質問にお答えします。',
    evening: 'こんばんは！株式会社Cのヘルプデスクへようこそ。今日一日お疲れ様でした。健康に関するご質問やご相談がありましたら、お気軽にどうぞ。',
    night: 'お疲れ様です。株式会社Cのヘルプデスクへようこそ。夜遅くまでご利用いただきありがとうございます。健康・医療に関するサポートを提供しています。'
  },
  
  // APIモデル設定を上書き
  apiSettings: {
    ...defaultConfig.apiSettings,
    chatModel: 'gpt-4o',  // より高性能なモデルを使用
    temperature: 0.4,     // より正確な医療情報のために低めの温度設定
    maxTokens: 1500       // より詳細な説明のためにトークン数を増加
  },
  
  // レート制限設定を上書き
  rateLimit: {
    ...defaultConfig.rateLimit,
    maxRequests: 15,      // より多くのリクエストを許可
    windowMs: 60 * 1000   // 1分間
  },
  
  // UI設定を上書き
  ui: {
    ...defaultConfig.ui,  // デフォルトのUI設定を継承
    primaryColor: '#e74c3c',  // 法人Cのブランドカラー（赤）
    secondaryColor: '#3498db',  // 青
    fontFamily: '"Hiragino Sans", "Meiryo", sans-serif',
    borderRadius: '6px',
    chatBubbleUserColor: '#fadbd8',  // 薄い赤
    chatBubbleAssistantColor: '#ebf5fb'  // 薄い青
  }
};

export default companyCConfig; 