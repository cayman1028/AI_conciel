import React, { useEffect, useRef, useState } from 'react';
import { chatbotConfig } from '../../config/chatbotConfig';
import { Message } from './types';
import { findBestResponse } from './utils';

const ChatBot: React.FC = () => {
  // メッセージの状態管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    if (messagesEndRef.current && messagesEndRef.current.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // メッセージ送信処理
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // ユーザーメッセージをチャット履歴に追加
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: Date.now()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    
    // ボットの応答を生成
    setTimeout(() => {
      const botResponse = findBestResponse(
        userMessage.text,
        chatbotConfig.responses,
        chatbotConfig.defaultResponse
      );
      
      const botMessage: Message = {
        id: Date.now().toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => [...prevMessages, botMessage]);
    }, 500); // 少し遅延を入れてより自然な会話に
  };
  
  // エンターキーでメッセージ送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const containerStyle: React.CSSProperties = {
    width: chatbotConfig.width,
    height: chatbotConfig.height,
    position: 'fixed' as const,
    bottom: chatbotConfig.bottom,
    right: chatbotConfig.right,
    backgroundColor: '#fff',
    borderRadius: chatbotConfig.borderRadius,
    boxShadow: chatbotConfig.boxShadow,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: chatbotConfig.fontFamily,
    fontSize: chatbotConfig.fontSize
  };
  
  const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: chatbotConfig.primaryColor,
    color: 'white',
    fontWeight: 'bold'
  };
  
  const messagesContainerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column'
  };
  
  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    borderTop: '1px solid #e0e0e0',
    padding: '8px'
  };
  
  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '8px 12px',
    outline: 'none'
  };
  
  const buttonStyle: React.CSSProperties = {
    backgroundColor: chatbotConfig.primaryColor,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    marginLeft: '8px',
    cursor: 'pointer'
  };
  
  const messageStyle = (sender: 'user' | 'bot'): React.CSSProperties => ({
    alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
    backgroundColor: sender === 'user' ? chatbotConfig.userMessageBgColor : chatbotConfig.botMessageBgColor,
    padding: chatbotConfig.messagePadding,
    margin: chatbotConfig.messageMargin,
    borderRadius: chatbotConfig.messageBorderRadius,
    maxWidth: '70%',
    wordBreak: 'break-word'
  });
  
  return (
    <div data-testid="chatbot-container" style={containerStyle}>
      <div style={headerStyle}>
        {chatbotConfig.title}
      </div>
      
      <div data-testid="chatbot-messages" style={messagesContainerStyle}>
        {messages.map(message => (
          <div 
            key={message.id}
            style={messageStyle(message.sender)}
            data-testid={message.sender === 'bot' ? 'bot-message' : 'user-message'}
          >
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div style={inputContainerStyle}>
        <input
          data-testid="chatbot-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={chatbotConfig.placeholder}
          style={inputStyle}
        />
        <button
          data-testid="chatbot-send-button"
          onClick={handleSendMessage}
          style={buttonStyle}
        >
          {chatbotConfig.sendButtonText}
        </button>
      </div>
    </div>
  );
};

export default ChatBot; 