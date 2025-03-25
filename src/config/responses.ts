import { Responses } from '../types/config';

const responses: Responses = {
  greeting: {
    welcome: 'こんにちは！AIコンシェルジュです。以下の項目からお選びください：',
    goodbye: 'ご利用ありがとうございました。またお気軽にお問い合わせください。'
  },
  error: {
    general: '申し訳ありません。エラーが発生しました。もう一度お試しください。',
    network: '通信エラーが発生しました。インターネット接続を確認してください。'
  },
  chatbot: {
    initial: 'ご質問内容をお選びください：',
    thinking: '回答を準備中です...',
    notFound: '申し訳ありません。その質問にはお答えできません。'
  },
  questions: {
    categories: [
      {
        id: 'general',
        title: '一般的な質問',
        questions: [
          {
            id: 'business_hours',
            text: '営業時間について',
            answer: '平日 9:00-18:00\n土日祝日は休業'
          },
          {
            id: 'location',
            text: '所在地について',
            answer: '〒100-0001\n東京都千代田区千代田1-1-1'
          }
        ]
      },
      {
        id: 'service',
        title: 'サービスについて',
        questions: [
          {
            id: 'price',
            text: '料金について',
            answer: '基本料金：無料\nオプションサービス：要相談'
          },
          {
            id: 'features',
            text: '主な機能について',
            answer: '・24時間対応\n・多言語対応\n・カスタマイズ可能'
          }
        ]
      }
    ]
  }
};

export function getResponses(): Responses {
  return responses;
} 