"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotConfig = void 0;
// チャットボットの設定
// 法人ごとにこのファイルをカスタマイズするだけで対応可能
exports.chatbotConfig = {
    // 基本設定
    title: 'お問い合わせアシスタント',
    placeholder: 'ご質問をどうぞ...',
    sendButtonText: '送信',
    // デザイン設定
    primaryColor: '#4a86e8',
    fontFamily: '"Hiragino Sans", "Meiryo", sans-serif',
    fontSize: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    // レイアウト設定
    width: '350px',
    height: '500px',
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    // メッセージのスタイル
    userMessageBgColor: '#e6f2ff',
    botMessageBgColor: '#f5f5f5',
    messagePadding: '10px 14px',
    messageMargin: '5px 0',
    messageBorderRadius: '15px',
    // 定型応答データ
    responses: [
        {
            keywords: ['こんにちは', 'こんばんは', 'おはよう', '初めまして'],
            response: 'こんにちは！何かお手伝いできることはありますか？'
        },
        {
            keywords: ['営業時間', '開店', '閉店', '開いている'],
            response: '営業時間は平日9:00〜18:00、土曜日10:00〜17:00です。日曜・祝日はお休みとなります。'
        },
        {
            keywords: ['住所', '場所', 'どこ', 'アクセス', '行き方'],
            response: '〒100-0001 東京都千代田区1-1-1 サンプルビル3階にございます。最寄り駅は東京メトロ丸の内線「東京駅」より徒歩5分です。'
        },
        {
            keywords: ['電話', '連絡', '問い合わせ'],
            response: 'お電話でのお問い合わせは03-1234-5678までお願いいたします。受付時間は平日9:00〜18:00となります。'
        },
        {
            keywords: ['予約', '申し込み', '申込'],
            response: 'ご予約は公式サイトのお問い合わせフォーム、またはお電話(03-1234-5678)にて承っております。'
        },
        {
            keywords: ['料金', '価格', '費用', 'いくら'],
            response: '料金プランの詳細は公式サイトの料金ページをご覧ください。基本プランは月額10,000円(税抜)からご利用いただけます。'
        }
    ],
    // どのキーワードにも一致しない場合のデフォルト応答
    defaultResponse: 'ご質問ありがとうございます。より詳しい情報は公式サイトをご覧いただくか、お電話(03-1234-5678)までお問い合わせください。'
};
