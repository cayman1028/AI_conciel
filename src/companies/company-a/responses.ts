/**
 * 法人A用の応答テンプレート
 * デフォルトの応答テンプレートを継承して、法人A固有の応答を上書きします
 */

import { defaultResponses } from '../default/responses';

export const companyAResponses = {
  ...defaultResponses,  // デフォルトの応答を継承
  
  // 挨拶を上書き
  greeting: {
    ...defaultResponses.greeting,
    welcome: '株式会社Aのサポートセンターへようこそ。製品やサービスについてのご質問にお答えします。',
    farewell: '株式会社Aをご利用いただきありがとうございます。今後ともよろしくお願いいたします。'
  },
  
  // よくある質問への応答を上書き
  faq: {
    ...defaultResponses.faq,
    businessHours: '株式会社Aの営業時間は平日の8:30から19:30、土曜日は10:00から17:00です。日曜・祝日はお休みです。',
    contactInfo: 'お問い合わせは support@company-a.example.com または 03-9876-5432 までご連絡ください。',
    returnPolicy: '当社製品の返品は購入後30日以内であれば無条件で承ります。カスタマーサポートにご連絡ください。'
  },
  
  // 法人A固有の応答を追加
  products: {
    productA: '製品Aは当社の主力製品で、高性能かつ使いやすいデザインが特徴です。詳細な仕様についてはお問い合わせください。',
    productB: '製品Bは最新のテクノロジーを搭載した次世代モデルです。昨年発売のモデルと比べて処理速度が50%向上しています。',
    comparison: '製品AとBの主な違いは処理能力とサイズです。具体的な用途に合わせてお選びいただけます。'
  },
  
  // サポート情報
  support: {
    warranty: '当社製品の保証期間は購入日から2年間です。保証書と購入証明書を大切に保管してください。',
    repair: '修理のご依頼は専用フォームまたはお電話にて承っております。通常3〜5営業日で対応いたします。',
    manual: '取扱説明書は当社ウェブサイトからPDF形式でダウンロードいただけます。'
  }
};

export default companyAResponses; 