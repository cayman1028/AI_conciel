'use client';

import styles from '@/styles/ChatWidget.module.css';
import { useEffect, useRef, useState } from 'react';

interface Message {
  text: string;
  isUser: boolean;
}

// ローカルストレージのキー
const STORAGE_KEY_MESSAGES = 'aiConcierge_messages';
const STORAGE_KEY_HISTORY = 'aiConcierge_history';

export default function ChatWidget() {
  // ローカルストレージからメッセージを読み込む
  const loadMessagesFromStorage = (): Message[] => {
    if (typeof window === 'undefined') return [{ text: 'こんにちは！当社のチャットボットへようこそ。どのようにお手伝いできますか？', isUser: false }];
    
    const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    return storedMessages 
      ? JSON.parse(storedMessages) 
      : [{ text: 'こんにちは！当社のチャットボットへようこそ。どのようにお手伝いできますか？', isUser: false }];
  };

  // ローカルストレージから会話履歴を読み込む
  const loadHistoryFromStorage = () => {
    if (typeof window === 'undefined') {
      return [
        { role: "system", content: "あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。" },
        { role: "assistant", content: "こんにちは！当社のチャットボットへようこそ。どのようにお手伝いできますか？" }
      ];
    }
    
    const storedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    return storedHistory 
      ? JSON.parse(storedHistory) 
      : [
          { role: "system", content: "あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。" },
          { role: "assistant", content: "こんにちは！当社のチャットボットへようこそ。どのようにお手伝いできますか？" }
        ];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessagesFromStorage);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 会話履歴を保存
  const [conversationHistory, setConversationHistory] = useState(loadHistoryFromStorage);

  // メッセージが変更されたらローカルストレージに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    }
  }, [messages]);

  // 会話履歴が変更されたらローカルストレージに保存
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // チャット履歴をクリアする関数
  const clearChatHistory = () => {
    const initialMessage = { text: 'こんにちは！当社のチャットボットへようこそ。どのようにお手伝いできますか？', isUser: false };
    const initialHistory = [
      { role: "system", content: "あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。" },
      { role: "assistant", content: "こんにちは！当社のチャットボットへようこそ。どのようにお手伝いできますか？" }
    ];
    
    setMessages([initialMessage]);
    setConversationHistory(initialHistory);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify([initialMessage]));
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(initialHistory));
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // ユーザーメッセージを追加
    setMessages(prev => [...prev, { text: inputValue, isUser: true }]);
    const userInput = inputValue;
    setInputValue('');

    // ユーザーメッセージを履歴に追加
    const updatedHistory = [...conversationHistory, { role: "user", content: userInput }];
    setConversationHistory(updatedHistory);

    // タイピングインジケーターを表示
    setIsTyping(true);

    try {
      // OpenAI APIにリクエスト
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedHistory }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      // タイピングインジケーターを非表示
      setIsTyping(false);
      
      // ボットの応答を表示
      const botResponse = data.content || "申し訳ありません、エラーが発生しました。";
      setMessages(prev => [...prev, { text: botResponse, isUser: false }]);
      
      // ボットの応答を履歴に追加
      setConversationHistory([...updatedHistory, { role: "assistant", content: botResponse }]);
    } catch (error) {
      console.error('Error:', error);
      
      // タイピングインジケーターを非表示
      setIsTyping(false);
      
      // エラー時はローカルで応答を生成
      const fallbackResponses = [
        'ありがとうございます。どのようなことでお困りですか？',
        'ご質問ありがとうございます。詳細を教えていただけますか？',
        'かしこまりました。他にお手伝いできることはありますか？',
        '申し訳ありませんが、その質問にはお答えできません。他のご質問はありますか？',
        'ご連絡ありがとうございます。担当者に確認して折り返しご連絡いたします。'
      ];
      
      const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      setMessages(prev => [...prev, { text: fallbackResponse, isUser: false }]);
      
      // フォールバック応答を履歴に追加
      setConversationHistory([...updatedHistory, { role: "assistant", content: fallbackResponse }]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.chatWidget}>
      {isExpanded ? (
        <div className={styles.expanded}>
          <div className={styles.header}>
            <div>企業チャットサポート</div>
            <div>
              <button onClick={clearChatHistory} className={styles.clearButton} title="履歴をクリア">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="white">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                </svg>
              </button>
              <button onClick={() => setIsExpanded(false)} className={styles.closeButton}>×</button>
            </div>
          </div>
          
          <div className={styles.chatContainer}>
            <div className={styles.messageList}>
              {messages.map((message, index) => (
                <div key={index} className={styles.message}>
                  {message.isUser ? (
                    <div className={styles.userMessage}>
                      {message.text}
                    </div>
                  ) : (
                    <div className={styles.botMessage}>
                      {message.text}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className={styles.inputContainer}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力..."
              className={styles.input}
            />
            <button onClick={handleSendMessage} className={styles.sendButton}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.chatIcon} onClick={() => setIsExpanded(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
            <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
          </svg>
          <span className={styles.chatIconLabel}>サポート</span>
        </div>
      )}
    </div>
  );
} 