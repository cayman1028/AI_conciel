'use client';

import {
  generateContextPrompt,
  recordUserQuestion,
  saveConversationTopics,
  updateTopic
} from '@/lib/userContext';
import styles from '@/styles/ChatWidget.module.css';
import { useEffect, useRef, useState } from 'react';

interface Message {
  text: string;
  isUser: boolean;
}

// ローカルストレージのキー
const STORAGE_KEY_MESSAGES = 'chatbot_messages';
const STORAGE_KEY_HISTORY = 'chatbot_history';

// 時間帯に応じた挨拶を取得する関数
const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'おはようございます！AIコンシェルへようこそ。今日も素晴らしい一日になりますように。何かお手伝いできることはありますか？';
  } else if (hour >= 12 && hour < 17) {
    return 'こんにちは！AIコンシェルへようこそ。どのようにお手伝いできますか？';
  } else if (hour >= 17 && hour < 22) {
    return 'こんばんは！AIコンシェルへようこそ。今日一日お疲れ様でした。何かお手伝いできることはありますか？';
  } else {
    return 'お疲れ様です。AIコンシェルへようこそ。夜遅くまでご利用いただきありがとうございます。どのようにお手伝いできますか？';
  }
};

export default function ChatWidget() {
  // 状態の初期化
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [userContextPrompt, setUserContextPrompt] = useState('');
  
  // メッセージの読み込み
  const loadMessagesFromStorage = (): Message[] => {
    if (typeof window === 'undefined') return [];
    
    const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (storedMessages) {
      return JSON.parse(storedMessages);
    }
    
    // 時間帯に応じたウェルカムメッセージ
    return [
      {
        text: getTimeBasedGreeting(),
        isUser: false
      }
    ];
  };
  
  // 会話履歴の読み込み
  const loadHistoryFromStorage = () => {
    if (typeof window === 'undefined') return [];
    
    const storedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }
    
    // デフォルトの会話履歴
    const greeting = getTimeBasedGreeting();
    return [
      { role: 'system', content: 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。時間帯に応じて適切な挨拶をしてください。' },
      { role: 'assistant', content: greeting }
    ];
  };
  
  // 初期化
  useEffect(() => {
    const storedMessages = loadMessagesFromStorage();
    const storedHistory = loadHistoryFromStorage();
    
    // 保存されたメッセージがある場合はそれを表示
    if (storedMessages.length > 0) {
      setMessages(storedMessages);
      setHistory(storedHistory);
    } else {
      // 初回表示時はウェルカムメッセージを表示
      const greeting = getTimeBasedGreeting();
      setMessages([{ text: greeting, isUser: false }]);
      
      setHistory([
        { role: 'system', content: 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。時間帯に応じて適切な挨拶をしてください。' },
        { role: 'assistant', content: greeting }
      ]);
    }
  }, []);
  
  // メッセージの保存
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
    }
  }, [messages]);
  
  // 履歴の保存
  useEffect(() => {
    if (typeof window !== 'undefined' && history.length > 0) {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    }
  }, [history]);
  
  // チャットの参照
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // メッセージ表示エリアの末尾への参照
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自動スクロール関数
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };
  
  // メッセージが変更されたら自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  // ユーザーコンテキストの更新
  useEffect(() => {
    // 会話が始まったらユーザーコンテキストを生成
    if (history.length > 1) {
      const contextPrompt = generateContextPrompt();
      setUserContextPrompt(contextPrompt);
    }
  }, [history]);
  
  // メッセージの送信処理
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // ユーザーの質問を記録
    recordUserQuestion(userMessage);
    
    // ユーザーメッセージの追加
    const newMessages = [
      ...messages,
      { text: userMessage, isUser: true }
    ];
    setMessages(newMessages);
    
    // 会話履歴の更新
    const newHistory = [
      ...history,
      { role: 'user', content: userMessage }
    ];
    setHistory(newHistory);
    
    // スクロール位置を固定
    scrollToBottom();
    
    // ローディング表示
    setIsLoading(true);
    
    // 最新のユーザーコンテキストを生成
    const contextPrompt = generateContextPrompt();
    setUserContextPrompt(contextPrompt);
    
    try {
      // APIリクエスト
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          userContext: contextPrompt
        }),
      });
      
      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました');
      }
      
      const data = await response.json();
      const assistantMessage = data.message.content;
      const cleanedMessage = assistantMessage.trim();
      
      // ローディング表示を非表示
      setIsLoading(false);
      
      // 応答メッセージを追加
      setMessages([
        ...newMessages,
        { text: cleanedMessage, isUser: false }
      ]);
      
      // トピックの保存
      if (data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
        saveConversationTopics(data.topics);
        if (data.topics[0]) {
          updateTopic(data.topics[0], cleanedMessage.substring(0, 100) + '...');
        }
      }
      
      // 会話履歴の更新
      setHistory([
        ...newHistory,
        { role: 'assistant', content: cleanedMessage }
      ]);
      
      // メッセージ追加後にスクロール
      setTimeout(scrollToBottom, 50);
      
    } catch (error) {
      console.error('エラー:', error);
      
      setIsLoading(false);
      setMessages([
        ...newMessages,
        { text: 'すみません、エラーが発生しました。もう一度お試しください。', isUser: false }
      ]);
      
      // エラーメッセージ表示後にスクロール
      setTimeout(scrollToBottom, 50);
    }
  };
  
  // キー入力処理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // 履歴のクリア
  const handleClearHistory = () => {
    const greeting = getTimeBasedGreeting();
    
    // メッセージをクリア
    setMessages([{ text: greeting, isUser: false }]);
    
    // ユーザーコンテキストをリセット
    setUserContextPrompt('');
    
    // 履歴をリセット
    setHistory([
      { role: 'system', content: 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。時間帯に応じて適切な挨拶をしてください。' },
      { role: 'assistant', content: greeting }
    ]);
    
    // スクロールを最下部に
    setTimeout(scrollToBottom, 50);
  };
  
  // チャットウィジェットの表示状態が変わったときのスクロール処理
  useEffect(() => {
    if (isExpanded) {
      // 少し遅延させてからスクロール（UIの更新を待つ）
      setTimeout(scrollToBottom, 300);
    }
  }, [isExpanded]);
  
  return (
    <div className={styles.chatWidget}>
      {!isExpanded ? (
        <button 
          className={styles.chatButton}
          onClick={() => setIsExpanded(true)}
          aria-label="サポート"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      ) : (
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              AIコンシェル
            </div>
            <div className={styles.chatControls}>
              <button 
                onClick={handleClearHistory}
                className={styles.clearButton}
                aria-label="履歴をクリア"
              >
                履歴をクリア
              </button>
              <button 
                onClick={() => setIsExpanded(false)}
                className={styles.closeButton}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className={styles.chatMessages} ref={chatContainerRef}>
            <div className={styles.messagesContainer}>
              {messages.map((message, index) => (
                <div key={index} className={styles.messageWrapper}>
                  <div 
                    className={`${styles.message} ${message.isUser ? styles.userMessage : styles.botMessage}`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              
              {/* ローディング表示 */}
              {isLoading && (
                <div className={styles.typingIndicator}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </div>
              )}
              
              {/* スクロール位置の参照ポイント */}
              <div ref={messagesEndRef} className={styles.messagesEnd} />
            </div>
          </div>
          
          <div className={styles.chatInput}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              rows={1}
              className={styles.inputField}
            />
            <button 
              onClick={handleSendMessage}
              className={styles.sendButton}
              disabled={!inputValue.trim() || isLoading}
              aria-label="送信"
            >
              送信
            </button>
          </div>
        </div>
      )}
    </div>
  );
}