/**
 * デフォルト設定ファイル
 * 法人固有の設定がない場合に使用される基本設定
 */

export const defaultConfig = {
  // 基本情報
  name: 'AIコンシェル',
  
  // 挨拶メッセージ
  greeting: {
    morning: 'おはようございます！AIコンシェルへようこそ。今日も素晴らしい一日になりますように。何かお手伝いできることはありますか？',
    afternoon: 'こんにちは！AIコンシェルへようこそ。どのようにお手伝いできますか？',
    evening: 'こんばんは！AIコンシェルへようこそ。今日一日お疲れ様でした。何かお手伝いできることはありますか？',
    night: 'お疲れ様です。AIコンシェルへようこそ。夜遅くまでご利用いただきありがとうございます。どのようにお手伝いできますか？'
  },
  
  // システムプロンプト
  systemPrompt: 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。時間帯に応じて適切な挨拶をしてください。朝（5時〜12時）は「おはようございます」、昼（12時〜17時）は「こんにちは」、夕方・夜（17時〜22時）は「こんばんは」、深夜（22時〜5時）は「お疲れ様です」と挨拶してください。',
  
  // APIモデル設定
  apiSettings: {
    chatModel: 'gpt-3.5-turbo',
    ambiguousExpressionModel: 'gpt-4o',
    topicExtractionModel: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
  },
  
  // レート制限設定
  rateLimit: {
    maxRequests: 10,
    windowMs: 60 * 1000 // 1分
  },
  
  // UI設定
  ui: {
    primaryColor: '#0070f3',
    secondaryColor: '#0070f3',
    fontFamily: 'sans-serif',
    borderRadius: '8px',
    chatBubbleUserColor: '#e1f5fe',
    chatBubbleAssistantColor: '#f5f5f5'
  }
};

export default defaultConfig; 