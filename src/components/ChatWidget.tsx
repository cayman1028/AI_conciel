'use client';

import { applyCompanyTheme, generateCssVariables, generateThemeStyles, getCompanyTheme } from '@/lib/companyTheme';
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

interface ChatWidgetProps {
  companyId?: string;
}

export default function ChatWidget({ companyId = 'default' }: ChatWidgetProps) {
  // 状態の初期化
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [userContextPrompt, setUserContextPrompt] = useState('');
  const [themeStyles, setThemeStyles] = useState<any>({});
  const [cssVars, setCssVars] = useState<string>('');
  const [currentStreamedText, setCurrentStreamedText] = useState('');
  
  // テーマの読み込み
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // 法人IDに基づいてテーマを取得
        const theme = await getCompanyTheme(companyId);
        
        // テーマからスタイルを生成
        const styles = generateThemeStyles(theme);
        setThemeStyles(styles);
        
        // CSSカスタムプロパティを生成
        const cssVariables = generateCssVariables(theme);
        setCssVars(cssVariables);
        
        // ドキュメント全体にテーマを適用
        if (typeof window !== 'undefined') {
          await applyCompanyTheme(companyId);
        }
        
        console.log(`法人ID "${companyId}" のテーマを適用しました`);
      } catch (error) {
        console.error('テーマの読み込みエラー:', error);
      }
    };
    
    loadTheme();
  }, [companyId]);
  
  // メッセージの読み込み
  const loadMessagesFromStorage = (): Message[] => {
    if (typeof window === 'undefined') return [];
    
    const storedMessages = localStorage.getItem(`${STORAGE_KEY_MESSAGES}_${companyId}`);
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
    
    const storedHistory = localStorage.getItem(`${STORAGE_KEY_HISTORY}_${companyId}`);
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
  }, [companyId]);
  
  // メッセージの保存
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(`${STORAGE_KEY_MESSAGES}_${companyId}`, JSON.stringify(messages));
    }
  }, [messages, companyId]);
  
  // 履歴の保存
  useEffect(() => {
    if (typeof window !== 'undefined' && history.length > 0) {
      localStorage.setItem(`${STORAGE_KEY_HISTORY}_${companyId}`, JSON.stringify(history));
    }
  }, [history, companyId]);
  
  // チャットの参照
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // メッセージ表示エリアの末尾への参照
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // チャットウィジェットのルート要素への参照
  const chatWidgetRef = useRef<HTMLDivElement>(null);
  
  // CSSカスタムプロパティの適用
  useEffect(() => {
    if (chatWidgetRef.current && cssVars) {
      chatWidgetRef.current.setAttribute('style', cssVars);
    }
  }, [cssVars]);
  
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
  }, [messages, isLoading, currentStreamedText]);
  
  // ユーザーコンテキストの更新
  useEffect(() => {
    // 会話が始まったらユーザーコンテキストを生成
    if (history.length > 1) {
      const contextPrompt = generateContextPrompt();
      setUserContextPrompt(contextPrompt);
    }
  }, [history]);
  
  // ストリーミングレスポンスの処理
  const handleStreamResponse = async (response: Response) => {
    if (!response.body) {
      throw new Error('レスポンスボディがありません');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamedText = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // デコードしてテキストを取得
        const chunk = decoder.decode(value, { stream: true });
        
        // Server-Sent Eventsの形式を解析
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'chunk') {
                // テキストチャンクを追加
                streamedText += data.content;
                setCurrentStreamedText(streamedText);
              } 
              else if (data.type === 'complete') {
                // 完了メッセージを処理
                const assistantMessage = data.message.content;
                
                // ストリーミング表示をクリア
                setCurrentStreamedText('');
                
                // 応答メッセージを追加
                setMessages(prevMessages => [
                  ...prevMessages,
                  { text: assistantMessage, isUser: false }
                ]);
                
                // 会話履歴の更新
                setHistory(prevHistory => [
                  ...prevHistory,
                  { role: 'assistant', content: assistantMessage }
                ]);
                
                // トピックの保存
                if (data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
                  saveConversationTopics(data.topics);
                  if (data.topics[0]) {
                    updateTopic(data.topics[0], assistantMessage.substring(0, 100) + '...');
                  }
                }
                
                // ローディング表示を非表示
                setIsLoading(false);
              } 
              else if (data.type === 'error') {
                // エラーメッセージを表示
                setMessages(prevMessages => [
                  ...prevMessages,
                  { text: data.error || 'エラーが発生しました。もう一度お試しください。', isUser: false }
                ]);
                
                // ローディング表示を非表示
                setIsLoading(false);
                setCurrentStreamedText('');
              }
            } catch (e) {
              console.error('ストリームデータの解析エラー:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('ストリーム読み取りエラー:', error);
      
      // エラー時はローディング表示を非表示
      setIsLoading(false);
      setCurrentStreamedText('');
      
      // エラーメッセージを表示
      setMessages(prevMessages => [
        ...prevMessages,
        { text: 'ストリーミング中にエラーが発生しました。もう一度お試しください。', isUser: false }
      ]);
    }
  };
  
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
    setCurrentStreamedText('');
    
    // 最新のユーザーコンテキストを生成
    const contextPrompt = generateContextPrompt();
    setUserContextPrompt(contextPrompt);
    
    try {
      // ストリーミングAPIリクエスト
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory,
          userContext: contextPrompt,
          companyId,
          stream: true // ストリーミングモードを有効化
        }),
      });
      
      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました');
      }
      
      // ストリーミングレスポンスの処理
      await handleStreamResponse(response);
      
    } catch (error) {
      console.error('エラー:', error);
      
      setIsLoading(false);
      setCurrentStreamedText('');
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
    <div className={styles.chatWidget} ref={chatWidgetRef}>
      {!isExpanded ? (
        <button 
          className={styles.chatButton}
          onClick={() => setIsExpanded(true)}
          aria-label="サポート"
          style={themeStyles.chatButtonStyle}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <line x1="8" y1="8" x2="16" y2="8" strokeWidth="1.5"></line>
            <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1.5"></line>
          </svg>
        </button>
      ) : (
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader} style={themeStyles.chatHeaderStyle}>
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
                    style={message.isUser ? themeStyles.userMessageStyle : themeStyles.botMessageStyle}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              
              {/* ストリーミング中のテキスト表示 */}
              {currentStreamedText && (
                <div className={styles.messageWrapper}>
                  <div 
                    className={`${styles.message} ${styles.botMessage}`}
                    style={themeStyles.botMessageStyle}
                  >
                    {currentStreamedText}
                  </div>
                </div>
              )}
              
              {/* ローディング表示（ストリーミング中は表示しない） */}
              {isLoading && !currentStreamedText && (
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
              style={themeStyles.sendButtonStyle}
            >
              送信
            </button>
          </div>
        </div>
      )}
    </div>
  );
}