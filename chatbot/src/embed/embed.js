"use strict";
/**
 * チャットボットを法人サイトに埋め込むためのスクリプト
 *
 * 使用方法:
 * 1. 下記スクリプトタグをHTMLに追加する
 * <script src="chatbot.js"></script>
 *
 * 2. スクリプト読み込み後に自動的にチャットボットが表示される
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const ChatBot_1 = __importDefault(require("../components/ChatBot/ChatBot"));
// グローバルな初期化関数を定義
window.initChatBot = () => {
    // チャットボットのコンテナ要素を作成
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chatbot-container';
    document.body.appendChild(chatbotContainer);
    // Reactコンポーネントをマウント
    const root = (0, client_1.createRoot)(chatbotContainer);
    root.render(react_1.default.createElement(ChatBot_1.default));
    // チャットボット読み込み完了イベントを発火
    window.dispatchEvent(new Event('ChatBotLoaded'));
};
// DOMContentLoadedイベントでチャットボットを自動初期化
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.initChatBot();
    });
}
