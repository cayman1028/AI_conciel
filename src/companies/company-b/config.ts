/**
 * 法人B用設定ファイル
 * デフォルト設定を継承して、法人B固有の設定を上書きします
 */

import { defaultConfig } from '../default/config';

export const companyBConfig = {
  ...defaultConfig,  // デフォルト設定を継承
  
  // 基本情報を上書き
  name: '株式会社B カスタマーサポート',
  
  // システムプロンプトを上書き
  systemPrompt: 'あなたは株式会社Bのカスタマーサポートアシスタントです。当社のITサービスに関する質問に丁寧に回答してください。技術的な内容も分かりやすく説明することを心がけてください。時間帯に応じて適切な挨拶をしてください。朝（5時〜12時）は「おはようございます」、昼（12時〜17時）は「こんにちは」、夕方・夜（17時〜22時）は「こんばんは」、深夜（22時〜5時）は「お疲れ様です」と挨拶してください。',
  
  // 挨拶メッセージを上書き
  greeting: {
    ...defaultConfig.greeting,
    morning: 'おはようございます！株式会社Bのカスタマーサポートへようこそ。ITサービスに関するご質問やお困りごとがありましたら、お気軽にお尋ねください。',
    afternoon: 'こんにちは！株式会社Bのカスタマーサポートへようこそ。ITサービスに関するサポートを提供しています。',
    evening: 'こんばんは！株式会社Bのカスタマーサポートへようこそ。今日も一日お疲れ様でした。ITに関するお悩みを解決いたします。',
    night: 'お疲れ様です。株式会社Bのカスタマーサポートへようこそ。夜遅くまでご利用いただきありがとうございます。ITサポートをご提供します。'
  },
  
  // APIモデル設定を上書き
  apiSettings: {
    ...defaultConfig.apiSettings,
    chatModel: 'gpt-4o',  // より高性能なモデルを使用
    temperature: 0.5,     // より一貫性のある応答に
  },
  
  // UI設定を上書き
  ui: {
    ...defaultConfig.ui,  // デフォルトのUI設定を継承
    primaryColor: '#3498db',  // 法人Bのブランドカラー（青）
    secondaryColor: '#2ecc71',  // 緑
    chatBubbleUserColor: '#ebf5fb',
    chatBubbleAssistantColor: '#eafaf1'
  }
};

export default companyBConfig; 