'use client';

import { applyCompanyTheme, generateCssVariables, generateThemeStyles, getCompanyTheme } from '@/lib/companyTheme';
import {
    generateContextPrompt,
    recordUserQuestion,
    saveConversationTopics,
    updateTopic
} from '@/lib/userContext';
import styles from '@/styles/ChatWidget.module.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

// メッセージのローカルストレージへの保存（スロットル処理）
let saveTimeout: NodeJS.Timeout | null = null;
const saveMessagesToStorage = (companyId: string, messages: Message[]) => {
  if (typeof window === 'undefined') return;
  
  // 既存のタイムアウトをクリア
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // 500ms後に保存処理を実行（頻繁な保存を防止）
  saveTimeout = setTimeout(() => {
    localStorage.setItem(`${STORAGE_KEY_MESSAGES}_${companyId}`, JSON.stringify(messages));
  }, 500);
};

// 履歴のローカルストレージへの保存（スロットル処理）
let saveHistoryTimeout: NodeJS.Timeout | null = null;
const saveHistoryToStorage = (companyId: string, history: any[]) => {
  if (typeof window === 'undefined') return;
  
  // 既存のタイムアウトをクリア
  if (saveHistoryTimeout) {
    clearTimeout(saveHistoryTimeout);
  }
  
  // 500ms後に保存処理を実行（頻繁な保存を防止）
  saveHistoryTimeout = setTimeout(() => {
    localStorage.setItem(`${STORAGE_KEY_HISTORY}_${companyId}`, JSON.stringify(history));
  }, 500);
};

// APIエンドポイントのプリウォーミング（初期接続時間を短縮）
let isApiWarmedUp = false;
const warmupApiConnection = async () => {
  if (isApiWarmedUp || typeof window === 'undefined') return;
  
  try {
    // タイムアウト処理を追加（3秒後にタイムアウト）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    // 軽量なリクエストを送信して接続を初期化
    const response = await fetch('/api/chat/warmup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warmup: true }),
      signal: controller.signal
    });
    
    // タイムアウトをクリア
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      isApiWarmedUp = true;
      console.log('API接続のプリウォーミングが完了しました:', data.message);
    } else {
      console.warn('API接続のプリウォーミングに失敗しました:', response.status);
      // 失敗しても次回の呼び出しを防ぐためにフラグを設定
      isApiWarmedUp = true;
    }
  } catch (error: any) {
    console.error('API接続のプリウォーミングに失敗しました:', error.name === 'AbortError' ? 'タイムアウト' : error);
    // エラーが発生しても次回の呼び出しを防ぐためにフラグを設定
    isApiWarmedUp = true;
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
  const [isTyping, setIsTyping] = useState(false);
  
  // APIコネクションのプリウォーミング
  useEffect(() => {
    // コンポーネントがマウントされたらAPIをプリウォーミング
    if (!isApiWarmedUp && typeof window !== 'undefined') {
      // 少し遅延させてページの初期ロードを妨げないようにする
      const timer = setTimeout(() => {
        warmupApiConnection();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
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
  const loadMessagesFromStorage = useCallback((): Message[] => {
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
  }, [companyId]);
  
  // 会話履歴の読み込み
  const loadHistoryFromStorage = useCallback(() => {
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
  }, [companyId]);
  
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
  }, [companyId, loadMessagesFromStorage, loadHistoryFromStorage]);
  
  // メッセージの保存（最適化版）
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(companyId, messages);
    }
  }, [messages, companyId]);
  
  // 履歴の保存（最適化版）
  useEffect(() => {
    if (history.length > 0) {
      saveHistoryToStorage(companyId, history);
    }
  }, [history, companyId]);
  
  // チャットの参照
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // メッセージ表示エリアの末尾への参照
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // チャットウィジェットのルート要素への参照
  const chatWidgetRef = useRef<HTMLDivElement>(null);
  
  // ストリーム処理のためのリーダー参照
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  
  // 入力中の状態を検出するためのタイマー
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 次のリクエストをプリフェッチするためのタイマー
  const prefetchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // プリフェッチされたコンテキスト
  const prefetchedContextRef = useRef<string>('');
  
  // CSSカスタムプロパティの適用
  useEffect(() => {
    if (chatWidgetRef.current && cssVars) {
      chatWidgetRef.current.setAttribute('style', cssVars);
    }
  }, [cssVars]);
  
  // 自動スクロール関数
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, []);
  
  // メッセージが変更されたら自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, currentStreamedText, scrollToBottom]);
  
  // ユーザーコンテキストの更新とプリフェッチ
  useEffect(() => {
    // 会話が始まったらユーザーコンテキストを生成
    if (history.length > 1) {
      // 非同期でコンテキストを生成し、プリフェッチしておく
      const generateAndCacheContext = async () => {
        const contextPrompt = generateContextPrompt();
        setUserContextPrompt(contextPrompt);
        prefetchedContextRef.current = contextPrompt;
      };
      
      generateAndCacheContext();
    }
  }, [history]);
  
  // 入力中の状態を検出する関数
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // 入力中の状態を更新
    if (newValue.trim() !== '') {
      setIsTyping(true);
      
      // 既存のタイマーをクリア
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      
      // 入力が停止したら500ms後にコンテキストをプリフェッチ
      typingTimerRef.current = setTimeout(() => {
        // 入力が一定時間停止したらプリフェッチを開始
        if (prefetchTimerRef.current) {
          clearTimeout(prefetchTimerRef.current);
        }
        
        prefetchTimerRef.current = setTimeout(() => {
          // 非同期でコンテキストを更新
          const contextPrompt = generateContextPrompt();
          prefetchedContextRef.current = contextPrompt;
        }, 300);
        
        setIsTyping(false);
      }, 500);
    } else {
      setIsTyping(false);
    }
  }, []);
  
  // ストリーミングレスポンスの処理を中止する関数
  const abortStreamProcessing = useCallback(async () => {
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
        readerRef.current = null;
      } catch (error) {
        console.error('ストリーム処理の中止エラー:', error);
      }
    }
  }, []);
  
  // コンポーネントのアンマウント時にストリーム処理を中止
  useEffect(() => {
    return () => {
      abortStreamProcessing();
      
      // タイマーをクリア
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current);
      }
    };
  }, [abortStreamProcessing]);
  
  // ストリーミングレスポンスの処理
  const handleStreamResponse = useCallback(async (response: Response) => {
    if (!response.body) {
      throw new Error('レスポンスボディがありません');
    }
    
    const reader = response.body.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();
    let streamedText = '';
    
    // タイムアウト処理
    const timeoutId = setTimeout(() => {
      if (readerRef.current) {
        console.warn('ストリーム読み取りがタイムアウトしました');
        readerRef.current.cancel('タイムアウト').catch(err => {
          console.error('ストリームキャンセルエラー:', err);
        });
        readerRef.current = null;
        
        // タイムアウト時の処理
        setIsLoading(false);
        setCurrentStreamedText('');
        setMessages(prevMessages => [
          ...prevMessages,
          { text: 'レスポンスがタイムアウトしました。もう一度お試しください。', isUser: false }
        ]);
      }
    }, 30000); // 30秒のタイムアウト
    
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
                
                // ローディング表示を非表示
                setIsLoading(false);
              }
              else if (data.type === 'topics') {
                // トピックの保存（完了メッセージの後に受信）
                if (data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
                  saveConversationTopics(data.topics);
                  if (data.topics[0]) {
                    // 最新のアシスタントメッセージを取得
                    const lastMessage = messages[messages.length - 1]?.text || '';
                    updateTopic(data.topics[0], lastMessage.substring(0, 100) + '...');
                  }
                }
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
    } catch (error: any) {
      // キャンセルされたエラーは無視
      if (error.name !== 'AbortError' && error.message !== 'タイムアウト') {
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
    } finally {
      clearTimeout(timeoutId);
      readerRef.current = null;
    }
  }, [messages, setHistory, setMessages]);
  
  // メッセージの送信処理
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // 進行中のストリーム処理があれば中止
    await abortStreamProcessing();
    
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
    
    // プリフェッチされたコンテキストを使用するか、新しく生成
    const contextPrompt = prefetchedContextRef.current || generateContextPrompt();
    setUserContextPrompt(contextPrompt);
    
    try {
      // AbortControllerの作成
      const controller = new AbortController();
      const signal = controller.signal;
      
      // タイムアウト処理
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('APIリクエストがタイムアウトしました');
      }, 30000); // 30秒のタイムアウト
      
      // リクエストの優先度を高く設定
      const requestInit: RequestInit = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Priority': 'high' // 優先度を示すカスタムヘッダー
        },
        body: JSON.stringify({
          messages: newHistory,
          userContext: contextPrompt,
          companyId,
          stream: true // ストリーミングモードを有効化
        }),
        signal, // AbortSignalを追加
        // 高優先度のリクエストとしてマーク
        priority: 'high' as any
      };
      
      // ストリーミングAPIリクエスト
      const response = await fetch('/api/chat', requestInit);
      
      // タイムアウトをクリア
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`APIリクエストに失敗しました: ${response.status} ${response.statusText}`);
      }
      
      // ストリーミングレスポンスの処理
      await handleStreamResponse(response);
      
      // 次のコンテキストをプリフェッチ（バックグラウンドで）
      setTimeout(() => {
        const newContextPrompt = generateContextPrompt();
        prefetchedContextRef.current = newContextPrompt;
      }, 1000);
      
    } catch (error: any) {
      // AbortErrorは無視
      if (error.name !== 'AbortError') {
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
    }
  }, [inputValue, messages, history, scrollToBottom, abortStreamProcessing, handleStreamResponse, companyId]);
  
  // キー入力処理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // 履歴のクリア
  const handleClearHistory = useCallback(() => {
    // 進行中のストリーム処理があれば中止
    abortStreamProcessing();
    
    const greeting = getTimeBasedGreeting();
    
    // メッセージをクリア
    setMessages([{ text: greeting, isUser: false }]);
    
    // ユーザーコンテキストをリセット
    setUserContextPrompt('');
    prefetchedContextRef.current = '';
    
    // 履歴をリセット
    setHistory([
      { role: 'system', content: 'あなたは企業のカスタマーサポートAIアシスタントです。丁寧で簡潔な応答を心がけてください。時間帯に応じて適切な挨拶をしてください。' },
      { role: 'assistant', content: greeting }
    ]);
    
    // ローディング状態とストリーミングテキストをクリア
    setIsLoading(false);
    setCurrentStreamedText('');
    
    // スクロールを最下部に
    setTimeout(scrollToBottom, 50);
  }, [abortStreamProcessing, scrollToBottom]);
  
  // チャットウィジェットの表示状態が変わったときのスクロール処理
  useEffect(() => {
    if (isExpanded) {
      // 少し遅延させてからスクロール（UIの更新を待つ）
      setTimeout(scrollToBottom, 300);
      
      // ウィジェットが開かれたらAPIをプリウォーミング
      warmupApiConnection();
    }
  }, [isExpanded, scrollToBottom]);
  
  // メッセージリストのメモ化
  const messagesList = useMemo(() => {
    return messages.map((message, index) => (
      <div key={index} className={styles.messageWrapper}>
        <div 
          className={`${styles.message} ${message.isUser ? styles.userMessage : styles.botMessage}`}
          style={message.isUser ? themeStyles.userMessageStyle : themeStyles.botMessageStyle}
          data-testid={message.isUser ? "user-message" : "assistant-message"}
        >
          {message.text}
        </div>
      </div>
    ));
  }, [messages, themeStyles.userMessageStyle, themeStyles.botMessageStyle]);
  
  return (
    <div className={styles.chatWidget} ref={chatWidgetRef} data-testid="chat-widget">
      {!isExpanded ? (
        <button 
          className={styles.chatButton}
          onClick={() => setIsExpanded(true)}
          aria-label="サポート"
          style={themeStyles.chatButtonStyle}
          onMouseEnter={warmupApiConnection} // ホバー時にAPIをプリウォーミング
          data-testid="chat-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <line x1="8" y1="8" x2="16" y2="8" strokeWidth="1.5"></line>
            <line x1="8" y1="12" x2="14" y2="12" strokeWidth="1.5"></line>
          </svg>
        </button>
      ) : (
        <div className={styles.chatContainer} style={{ ...themeStyles.chatContainerStyle, '--chat-vars': cssVars } as React.CSSProperties}>
          <div className={styles.chatHeader} style={themeStyles.chatHeaderStyle}>
            <div className={styles.chatTitle}>AIコンシェル</div>
            <button 
              className={styles.closeButton}
              onClick={() => setIsExpanded(false)}
              aria-label="閉じる"
              data-testid="close-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className={styles.chatBody}>
            <div className={styles.messagesContainer} ref={chatContainerRef}>
              {messagesList}
              
              {/* ストリーミング中のテキスト表示 */}
              {currentStreamedText && (
                <div className={styles.messageWrapper}>
                  <div 
                    className={`${styles.message} ${styles.botMessage}`}
                    style={themeStyles.botMessageStyle}
                    data-testid="assistant-message"
                  >
                    {currentStreamedText}
                  </div>
                </div>
              )}
              
              {/* ローディング表示（ストリーミング中は表示しない） */}
              {isLoading && !currentStreamedText && (
                <div className={styles.typingIndicator} data-testid="typing-indicator">
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
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力..."
              rows={1}
              className={styles.inputField}
              disabled={isLoading}
              data-testid="chat-input"
            />
            <button 
              onClick={handleSendMessage}
              className={styles.sendButton}
              disabled={!inputValue.trim() || isLoading}
              aria-label="送信"
              style={themeStyles.sendButtonStyle}
              data-testid="send-button"
            >
              送信
            </button>
          </div>
        </div>
      )}
    </div>
  );
}