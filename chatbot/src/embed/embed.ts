/**
 * チャットボットを法人サイトに埋め込むためのスクリプト
 * 
 * 使用方法:
 * 1. 下記スクリプトタグをHTMLに追加する
 * <script src="chatbot.js"></script>
 * 
 * 2. スクリプト読み込み後に自動的にチャットボットが表示される
 */

// グローバルな初期化関数を定義
(window as any).initChatBot = () => {
  // チャットボットのコンテナ要素を作成
  const chatbotContainer = document.createElement('div');
  chatbotContainer.id = 'chatbot-container';
  document.body.appendChild(chatbotContainer);
  
  // 実際の環境では、ここでReactコンポーネントをマウントする
  // 本番環境では下記のコードを使用
  // 
  // import React from 'react';
  // import { createRoot } from 'react-dom/client';
  // import ChatBot from '../components/ChatBot/ChatBot';
  // 
  // const root = createRoot(chatbotContainer);
  // root.render(React.createElement(ChatBot));
  
  // チャットボット読み込み完了イベントを発火
  window.dispatchEvent(new Event('ChatBotLoaded'));
};

// DOMContentLoadedイベントでチャットボットを自動初期化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    (window as any).initChatBot();
  });
} 