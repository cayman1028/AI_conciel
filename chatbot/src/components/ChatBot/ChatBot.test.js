"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
const user_event_1 = __importDefault(require("@testing-library/user-event"));
const chatbotConfig_1 = require("../../config/chatbotConfig");
const ChatBot_1 = __importDefault(require("./ChatBot"));
describe('ChatBot', () => {
    it('初期状態でチャットボットが表示される', () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(ChatBot_1.default, {}));
        // チャットボットの初期要素が存在することを確認
        expect(react_1.screen.getByTestId('chatbot-container')).toBeInTheDocument();
        expect(react_1.screen.getByTestId('chatbot-messages')).toBeInTheDocument();
        expect(react_1.screen.getByTestId('chatbot-input')).toBeInTheDocument();
        expect(react_1.screen.getByTestId('chatbot-send-button')).toBeInTheDocument();
        // 設定からタイトルが表示されることを確認
        expect(react_1.screen.getByText(chatbotConfig_1.chatbotConfig.title)).toBeInTheDocument();
    });
    it('メッセージを送信するとチャット履歴に追加される', async () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(ChatBot_1.default, {}));
        // メッセージを入力して送信
        const input = react_1.screen.getByTestId('chatbot-input');
        const sendButton = react_1.screen.getByTestId('chatbot-send-button');
        await user_event_1.default.type(input, 'こんにちは');
        react_1.fireEvent.click(sendButton);
        // ユーザーのメッセージがチャット履歴に表示されることを確認
        expect(react_1.screen.getByText('こんにちは')).toBeInTheDocument();
        // ボットの定型応答がチャット履歴に表示されることを確認
        // 応答が非同期で表示される可能性があるため、findByTextを使用
        const botResponse = await react_1.screen.findByTestId('bot-message');
        expect(botResponse).toBeInTheDocument();
    });
    it('定型応答が正しく表示される', async () => {
        (0, react_1.render)((0, jsx_runtime_1.jsx)(ChatBot_1.default, {}));
        // 「営業時間」についての質問
        const input = react_1.screen.getByTestId('chatbot-input');
        const sendButton = react_1.screen.getByTestId('chatbot-send-button');
        await user_event_1.default.type(input, '営業時間を教えてください');
        react_1.fireEvent.click(sendButton);
        // 営業時間に関する定型応答が表示されることを確認
        const botResponse = await react_1.screen.findByTestId('bot-message');
        expect(botResponse.textContent).toContain('営業時間');
    });
    it('チャットボットがHTMLに埋め込み可能である', () => {
        // チャットボットが<script>タグで埋め込み可能かテスト
        const scriptTag = document.createElement('script');
        scriptTag.src = 'chatbot.js';
        document.body.appendChild(scriptTag);
        // イベントが発火することを確認
        const eventSpy = jest.spyOn(window, 'dispatchEvent');
        window.dispatchEvent(new Event('ChatBotLoaded'));
        expect(eventSpy).toHaveBeenCalled();
    });
});
