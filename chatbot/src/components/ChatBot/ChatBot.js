"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const chatbotConfig_1 = require("../../config/chatbotConfig");
const utils_1 = require("./utils");
const ChatBot = () => {
    // メッセージの状態管理
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [inputValue, setInputValue] = (0, react_1.useState)('');
    const messagesEndRef = (0, react_1.useRef)(null);
    // メッセージが追加されたら自動スクロール
    (0, react_1.useEffect)(() => {
        if (messagesEndRef.current && messagesEndRef.current.scrollIntoView) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);
    // メッセージ送信処理
    const handleSendMessage = () => {
        if (!inputValue.trim())
            return;
        // ユーザーメッセージをチャット履歴に追加
        const userMessage = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: Date.now()
        };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setInputValue('');
        // ボットの応答を生成
        setTimeout(() => {
            const botResponse = (0, utils_1.findBestResponse)(userMessage.text, chatbotConfig_1.chatbotConfig.responses, chatbotConfig_1.chatbotConfig.defaultResponse);
            const botMessage = {
                id: Date.now().toString(),
                text: botResponse,
                sender: 'bot',
                timestamp: Date.now()
            };
            setMessages(prevMessages => [...prevMessages, botMessage]);
        }, 500); // 少し遅延を入れてより自然な会話に
    };
    // エンターキーでメッセージ送信
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };
    const containerStyle = {
        width: chatbotConfig_1.chatbotConfig.width,
        height: chatbotConfig_1.chatbotConfig.height,
        position: 'fixed',
        bottom: chatbotConfig_1.chatbotConfig.bottom,
        right: chatbotConfig_1.chatbotConfig.right,
        backgroundColor: '#fff',
        borderRadius: chatbotConfig_1.chatbotConfig.borderRadius,
        boxShadow: chatbotConfig_1.chatbotConfig.boxShadow,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: chatbotConfig_1.chatbotConfig.fontFamily,
        fontSize: chatbotConfig_1.chatbotConfig.fontSize
    };
    const headerStyle = {
        padding: '12px 16px',
        backgroundColor: chatbotConfig_1.chatbotConfig.primaryColor,
        color: 'white',
        fontWeight: 'bold'
    };
    const messagesContainerStyle = {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column'
    };
    const inputContainerStyle = {
        display: 'flex',
        borderTop: '1px solid #e0e0e0',
        padding: '8px'
    };
    const inputStyle = {
        flex: 1,
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '8px 12px',
        outline: 'none'
    };
    const buttonStyle = {
        backgroundColor: chatbotConfig_1.chatbotConfig.primaryColor,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '8px 16px',
        marginLeft: '8px',
        cursor: 'pointer'
    };
    const messageStyle = (sender) => ({
        alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
        backgroundColor: sender === 'user' ? chatbotConfig_1.chatbotConfig.userMessageBgColor : chatbotConfig_1.chatbotConfig.botMessageBgColor,
        padding: chatbotConfig_1.chatbotConfig.messagePadding,
        margin: chatbotConfig_1.chatbotConfig.messageMargin,
        borderRadius: chatbotConfig_1.chatbotConfig.messageBorderRadius,
        maxWidth: '70%',
        wordBreak: 'break-word'
    });
    return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": "chatbot-container", style: containerStyle, children: [(0, jsx_runtime_1.jsx)("div", { style: headerStyle, children: chatbotConfig_1.chatbotConfig.title }), (0, jsx_runtime_1.jsxs)("div", { "data-testid": "chatbot-messages", style: messagesContainerStyle, children: [messages.map(message => ((0, jsx_runtime_1.jsx)("div", { style: messageStyle(message.sender), "data-testid": message.sender === 'bot' ? 'bot-message' : 'user-message', children: message.text }, message.id))), (0, jsx_runtime_1.jsx)("div", { ref: messagesEndRef })] }), (0, jsx_runtime_1.jsxs)("div", { style: inputContainerStyle, children: [(0, jsx_runtime_1.jsx)("input", { "data-testid": "chatbot-input", type: "text", value: inputValue, onChange: (e) => setInputValue(e.target.value), onKeyPress: handleKeyPress, placeholder: chatbotConfig_1.chatbotConfig.placeholder, style: inputStyle }), (0, jsx_runtime_1.jsx)("button", { "data-testid": "chatbot-send-button", onClick: handleSendMessage, style: buttonStyle, children: chatbotConfig_1.chatbotConfig.sendButtonText })] })] }));
};
exports.default = ChatBot;
