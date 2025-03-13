'use client';

import { getCompanyConfig } from '@/lib/companyConfig';
import { getResponseTemplate } from '@/lib/companyResponses';
import { applyCompanyTheme } from '@/lib/companyTheme';
import {
    generateContextPrompt,
    recordAmbiguousExpression,
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

interface ChatWidgetProps {
  companyId?: string;
}

// ローカルストレージのキー
const STORAGE_KEY_MESSAGES = 'chatbot_messages';
const STORAGE_KEY_HISTORY = 'chatbot_history';

// 時間帯に応じた挨拶を取得する関数
const getTimeBasedGreeting = async (companyId: string = 'default'): Promise<string> => {
  const hour = new Date().getHours();
  
  let greetingKey = '';
  if (hour >= 5 && hour < 12) {
    greetingKey = 'morning';
  } else if (hour >= 12 && hour < 17) {
    greetingKey = 'afternoon';
  } else if (hour >= 17 && hour < 22) {
    greetingKey = 'evening';
  } else {
    greetingKey = 'night';
  }
  
  try {
    // 法人設定から挨拶を取得
    const config = await getCompanyConfig(companyId);
    if (config.greeting && config.greeting[greetingKey]) {
      return config.greeting[greetingKey];
    }
    
    // 法人応答テンプレートから挨拶を取得
    return await getResponseTemplate(
      companyId,
      'greeting',
      'welcome',
      'AIコンシェルへようこそ。どのようにお手伝いできますか？'
    );
  } catch (error) {
    console.error('挨拶の取得エラー:', error);
    
    // フォールバック挨拶
    if (greetingKey === 'morning') {
      return 'おはようございます！AIコンシェルへようこそ。今日も素晴らしい一日になりますように。何かお手伝いできることはありますか？';
    } else if (greetingKey === 'afternoon') {
      return 'こんにちは！AIコンシェルへようこそ。どのようにお手伝いできますか？';
    } else if (greetingKey === 'evening') {
      return 'こんばんは！AIコンシェルへようこそ。今日一日お疲れ様でした。何かお手伝いできることはありますか？';
    } else {
      return 'お疲れ様です。AIコンシェルへようこそ。夜遅くまでご利用いただきありがとうございます。どのようにお手伝いできますか？';
    }
  }
};

export default function ChatWidget({ companyId = 'default' }: ChatWidgetProps) {
  // 状態の初期化
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [userContextPrompt, setUserContextPrompt] = useState('');
  const [companyConfig, setCompanyConfig] = useState<any>(null);
  
  // 法人設定の読み込み
  useEffect(() => {
    const loadCompanyConfig = async () => {
      try {
        const config = await getCompanyConfig(companyId);
        setCompanyConfig(config);
        
        // テーマの適用
        if (typeof document !== 'undefined') {
          applyCompanyTheme(companyId);
        }
      } catch (error) {
        console.error('法人設定の読み込みエラー:', error);
      }
    };
    
    loadCompanyConfig();
  }, [companyId]);
  
  // メッセージの読み込み
  const loadMessagesFromStorage = async (): Promise<Message[]> => {
    if (typeof window === 'undefined') return [];
    
    const storedMessages = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (storedMessages) {
      return JSON.parse(storedMessages);
    }
    
    // 時間帯に応じたウェルカムメッセージ
    const greeting = await getTimeBasedGreeting(companyId);
    return [
      {
        text: greeting,
        isUser: false
      }
    ];
  };
  
  // 会話履歴の読み込み
  const loadHistoryFromStorage = async () => {
    if (typeof window === 'undefined') return [];
    
    const storedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }
    
    // 法人設定からシステムプロンプトを取得
    const config = await getCompanyConfig(companyId);
    const systemPrompt = config.systemPrompt || 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。';
    
    // デフォルトの会話履歴
    const greeting = await getTimeBasedGreeting(companyId);
    return [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: greeting }
    ];
  };
  
  // 初期化
  useEffect(() => {
    const initializeChat = async () => {
      const storedMessages = await loadMessagesFromStorage();
      const storedHistory = await loadHistoryFromStorage();
      
      // 保存されたメッセージがある場合はそれを表示
      if (storedMessages.length > 0) {
        setMessages(storedMessages);
        setHistory(storedHistory);
      } else {
        // 初回表示時はウェルカムメッセージを表示
        const greeting = await getTimeBasedGreeting(companyId);
        setMessages([{ text: greeting, isUser: false }]);
        
        // 法人設定からシステムプロンプトを取得
        const config = await getCompanyConfig(companyId);
        const systemPrompt = config.systemPrompt || 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。';
        
        setHistory([
          { role: 'system', content: systemPrompt },
          { role: 'assistant', content: greeting }
        ]);
      }
    };
    
    initializeChat();
  }, [companyId]);
  
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
          userContext: contextPrompt,
          companyId: companyId  // 法人IDをAPIに渡す
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
      
      // あいまい表現の保存
      if (data.ambiguousExpression && data.ambiguousExpression.detected) {
        // 現在のトピックを取得（存在する場合）
        const currentTopic = data.topics && data.topics.length > 0 ? data.topics[0] : undefined;
        
        recordAmbiguousExpression(
          data.ambiguousExpression.expression,
          data.ambiguousExpression.interpretation,
          data.ambiguousExpression.confidence,
          data.ambiguousExpression.context_factors,
          currentTopic
        );
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
      
      // 法人固有のエラーメッセージを取得
      let errorMessage = 'すみません、エラーが発生しました。もう一度お試しください。';
      try {
        errorMessage = await getResponseTemplate(
          companyId,
          'errors',
          'general',
          errorMessage
        );
      } catch (e) {
        console.error('エラーメッセージの取得に失敗:', e);
      }
      
      setIsLoading(false);
      setMessages([
        ...newMessages,
        { text: errorMessage, isUser: false }
      ]);
      
      // エラーメッセージを履歴に追加
      setHistory([
        ...newHistory,
        { role: 'assistant', content: errorMessage }
      ]);
      
      // メッセージ追加後にスクロール
      setTimeout(scrollToBottom, 50);
    }
  };
  
  // 入力フィールドのキーダウンイベント処理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // チャットウィジェットの展開/折りたたみ
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // チャットをクリア
  const clearChat = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    }
    
    // 初期化
    const initializeChat = async () => {
      const greeting = await getTimeBasedGreeting(companyId);
      setMessages([{ text: greeting, isUser: false }]);
      
      // 法人設定からシステムプロンプトを取得
      const config = await getCompanyConfig(companyId);
      const systemPrompt = config.systemPrompt || 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。';
      
      setHistory([
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: greeting }
      ]);
    };
    
    initializeChat();
  };
  
  return (
    <div className={`${styles.chatWidget} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.chatHeader} onClick={toggleExpand}>
        <h3>{companyConfig?.name || 'AIコンシェル'}</h3>
        <button className={styles.expandButton}>
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>
      
      {isExpanded && (
        <>
          <div className={styles.chatContainer} ref={chatContainerRef}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.message} ${
                  message.isUser ? styles.userMessage : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>{message.text}</div>
              </div>
            ))}
            
            {isLoading && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className={styles.inputContainer}>
            <textarea
              className={styles.inputField}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              rows={1}
            />
            <button
              className={styles.sendButton}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              送信
            </button>
          </div>
          
          <div className={styles.chatFooter}>
            <button className={styles.clearButton} onClick={clearChat}>
              会話をクリア
            </button>
          </div>
        </>
      )}
    </div>
  );
}