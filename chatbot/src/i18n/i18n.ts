// 利用可能な言語一覧
export const availableLanguages = ['ja', 'en'];

// 翻訳データの型定義
export interface Translation {
  title: string;
  placeholder: string;
  sendButtonText: string;
  defaultResponse: string;
  responses: {
    [key: string]: string;
  };
}

// 日本語の翻訳データ
const jaTranslations: Translation = {
  title: 'お問い合わせアシスタント',
  placeholder: 'ご質問をどうぞ...',
  sendButtonText: '送信',
  defaultResponse: 'ご質問ありがとうございます。より詳しい情報は公式サイトをご覧いただくか、お問い合わせください。',
  responses: {
    greeting: 'こんにちは！何かお手伝いできることはありますか？',
    hours: '営業時間は平日9:00〜18:00、土曜日10:00〜17:00です。日曜・祝日はお休みとなります。',
  }
};

// 英語の翻訳データ
const enTranslations: Translation = {
  title: 'Support Assistant',
  placeholder: 'Ask your question...',
  sendButtonText: 'Send',
  defaultResponse: 'Thank you for your question. For more information, please visit our official website or contact us.',
  responses: {
    greeting: 'Hello! How can I help you today?',
    hours: 'Our business hours are Monday to Friday 9:00-18:00, Saturday 10:00-17:00. We are closed on Sundays and holidays.',
  }
};

// 翻訳データのマッピング
const translations: { [key: string]: Translation } = {
  ja: jaTranslations,
  en: enTranslations
};

// デフォルトの言語
let currentLanguage = 'ja';

// 翻訳を取得する関数
export const getTranslation = async (lang: string): Promise<Translation> => {
  // 実際のアプリケーションでは、ここで非同期にファイルを読み込むことも可能
  return Promise.resolve(translations[lang] || translations['ja']);
};

// 現在の言語を取得する関数
export const getCurrentLanguage = (): string => {
  return currentLanguage;
};

// 言語を設定する関数
export const setLanguage = (lang: string): void => {
  if (availableLanguages.includes(lang)) {
    currentLanguage = lang;
  }
};

// I18nプロバイダーのモック（テスト用）
export const I18nProvider = {
  // 空の実装
};

// 翻訳データを使用するためのフック（モック）
export const useTranslation = () => {
  return {
    currentLanguage: getCurrentLanguage(),
    translations: translations[getCurrentLanguage()],
    setLanguage
  };
};