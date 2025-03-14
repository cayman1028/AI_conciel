// ユーザーコンテキスト管理

// ローカルストレージのキー
export const USER_CONTEXT_KEY = 'user_context';
export const CONVERSATION_TOPICS_KEY = 'conversation_topics';
export const AMBIGUOUS_EXPRESSIONS_KEY = 'ambiguous_expressions';

// あいまい表現の型定義
export interface AmbiguousExpression {
  expression: string;
  interpretation: string;
  timestamp: number;
  confidence?: number;
  contextFactors?: string[];
  topic?: string;
  situation?: string;
}

// ユーザーコンテキストの型定義
export interface UserContext {
  preferences: {
    [key: string]: string | number | boolean;
  };
  recentQuestions: {
    text: string;
    timestamp: number;
  }[];
  topics: {
    [key: string]: {
      lastMentioned: number;
      details: string;
    };
  };
  ambiguousExpressions: AmbiguousExpression[];
}

// メモリキャッシュ（高速化のため）
const memoryCache: {
  userContext: UserContext | null;
  conversationTopics: string[] | null;
  contextPrompt: string | null;
  userContextTimestamp: number;
  topicsTimestamp: number;
  contextPromptTimestamp: number;
  saveTimeout: NodeJS.Timeout | null;
} = {
  userContext: null,
  conversationTopics: null,
  contextPrompt: null,
  userContextTimestamp: 0,
  topicsTimestamp: 0,
  contextPromptTimestamp: 0,
  saveTimeout: null
};

// キャッシュの有効期限（60秒）
const CACHE_TTL = 60 * 1000;

// デフォルトのユーザーコンテキスト
export const defaultUserContext: UserContext = {
  preferences: {},
  recentQuestions: [],
  topics: {},
  ambiguousExpressions: [],
};

// ユーザーコンテキストの取得（キャッシュ対応）
export const getUserContext = (): UserContext => {
  if (typeof window === 'undefined') return defaultUserContext;
  
  // キャッシュにあればそれを返す
  if (memoryCache.userContext) {
    return memoryCache.userContext;
  }
  
  const storedContext = localStorage.getItem(USER_CONTEXT_KEY);
  if (storedContext) {
    try {
      const parsedContext = JSON.parse(storedContext);
      // キャッシュに保存
      memoryCache.userContext = parsedContext;
      return parsedContext;
    } catch (e) {
      console.error('ユーザーコンテキストの解析に失敗しました:', e);
      // キャッシュにデフォルト値を保存
      memoryCache.userContext = defaultUserContext;
      return defaultUserContext;
    }
  }
  
  // キャッシュにデフォルト値を保存
  memoryCache.userContext = defaultUserContext;
  return defaultUserContext;
};

// ユーザーコンテキストの保存（スロットル処理）
export const saveUserContext = (context: UserContext): void => {
  if (typeof window === 'undefined') return;
  
  // キャッシュを更新
  memoryCache.userContext = context;
  
  // コンテキストプロンプトのキャッシュをクリア（内容が変わったため）
  memoryCache.contextPrompt = null;
  
  // 既存のタイムアウトをクリア
  if (memoryCache.saveTimeout) {
    clearTimeout(memoryCache.saveTimeout);
  }
  
  // 非同期で保存（UIブロッキングを防止、頻繁な保存を防止）
  memoryCache.saveTimeout = setTimeout(() => {
    localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(context));
    memoryCache.saveTimeout = null;
  }, 300);
};

// 会話トピックの抽出（APIから返されるトピックを保存）
export const saveConversationTopics = (topics: string[]): void => {
  if (typeof window === 'undefined') return;
  
  // キャッシュから取得または初期化
  const currentTopics = memoryCache.conversationTopics || getConversationTopics();
  
  // 重複を排除して新しいトピックを追加
  const newTopicsSet = new Set([...currentTopics]);
  topics.forEach(topic => newTopicsSet.add(topic));
  const newTopics = Array.from(newTopicsSet);
  
  // キャッシュを更新
  memoryCache.conversationTopics = newTopics;
  
  // コンテキストプロンプトのキャッシュをクリア（内容が変わったため）
  memoryCache.contextPrompt = null;
  
  // 非同期で保存（UIブロッキングを防止）
  setTimeout(() => {
    localStorage.setItem(CONVERSATION_TOPICS_KEY, JSON.stringify(newTopics));
  }, 0);
};

// 会話トピックの取得（キャッシュ対応）
export const getConversationTopics = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  // キャッシュにあればそれを返す
  if (memoryCache.conversationTopics) {
    return memoryCache.conversationTopics;
  }
  
  const storedTopics = localStorage.getItem(CONVERSATION_TOPICS_KEY);
  if (storedTopics) {
    try {
      const parsedTopics = JSON.parse(storedTopics);
      // キャッシュに保存
      memoryCache.conversationTopics = parsedTopics;
      return parsedTopics;
    } catch (e) {
      console.error('会話トピックの解析に失敗しました:', e);
      // キャッシュに空配列を保存
      memoryCache.conversationTopics = [];
      return [];
    }
  }
  
  // キャッシュに空配列を保存
  memoryCache.conversationTopics = [];
  return [];
};

// ユーザーの質問を記録（最適化版）
export const recordUserQuestion = (question: string): void => {
  // キャッシュから直接取得（または初期化）
  const context = memoryCache.userContext || getUserContext();
  
  // 最新の質問を先頭に追加（最大10件まで保存）
  context.recentQuestions = [
    { text: question, timestamp: Date.now() },
    ...context.recentQuestions.slice(0, 9)
  ];
  
  saveUserContext(context);
};

// トピックの更新（最適化版）
export const updateTopic = (topic: string, details: string): void => {
  // キャッシュから直接取得（または初期化）
  const context = memoryCache.userContext || getUserContext();
  
  context.topics[topic] = {
    lastMentioned: Date.now(),
    details
  };
  
  saveUserContext(context);
};

// ユーザーの好みを記録（最適化版）
export const recordUserPreference = (key: string, value: string | number | boolean): void => {
  // キャッシュから直接取得（または初期化）
  const context = memoryCache.userContext || getUserContext();
  
  context.preferences[key] = value;
  
  saveUserContext(context);
};

// 曖昧表現の記録（最適化版）
export const recordAmbiguousExpression = (
  expression: string, 
  interpretation: string, 
  confidence?: number,
  contextFactors?: string[],
  topic?: string
) => {
  // キャッシュから直接取得（または初期化）
  const context = memoryCache.userContext || getUserContext();
  
  // ambiguousExpressionsが存在しない場合は初期化
  if (!context.ambiguousExpressions) {
    context.ambiguousExpressions = [];
  }
  
  // 時間帯の判定
  const hour = new Date().getHours();
  let situation = '';
  
  if (hour >= 5 && hour < 12) {
    situation = '朝';
  } else if (hour >= 12 && hour < 17) {
    situation = '昼';
  } else if (hour >= 17 && hour < 22) {
    situation = '夕方・夜';
  } else {
    situation = '深夜';
  }
  
  // 既存の表現があれば更新、なければ追加
  const existingIndex = context.ambiguousExpressions.findIndex(
    item => item.expression.toLowerCase() === expression.toLowerCase()
  );
  
  if (existingIndex >= 0) {
    // 既存の表現を更新（古い情報は保持しつつ新しい情報で上書き）
    context.ambiguousExpressions[existingIndex] = {
      ...context.ambiguousExpressions[existingIndex],
      expression,
      interpretation,
      timestamp: Date.now(),
      confidence: confidence !== undefined ? confidence : context.ambiguousExpressions[existingIndex].confidence,
      contextFactors: contextFactors || context.ambiguousExpressions[existingIndex].contextFactors,
      topic: topic || context.ambiguousExpressions[existingIndex].topic,
      situation
    };
  } else {
    // 新しい表現を先頭に追加（最大20件まで保存）
    context.ambiguousExpressions = [
      { 
        expression, 
        interpretation, 
        timestamp: Date.now(),
        confidence,
        contextFactors,
        topic,
        situation
      },
      ...context.ambiguousExpressions.slice(0, 19)
    ];
  }
  
  // 非同期で保存
  saveUserContext(context);
};

// あいまい表現の取得（最適化版）
export const getAmbiguousExpressions = (options?: {
  expression?: string;
  topic?: string;
  minConfidence?: number;
  situation?: string;
}): AmbiguousExpression[] => {
  // キャッシュから直接取得（または初期化）
  const context = memoryCache.userContext || getUserContext();
  
  // ambiguousExpressionsが存在しない場合は空配列を返す
  if (!context.ambiguousExpressions) {
    context.ambiguousExpressions = [];
    return [];
  }
  
  if (!options) {
    return context.ambiguousExpressions;
  }
  
  // フィルタリング
  return context.ambiguousExpressions.filter(item => {
    if (options.expression && !item.expression.toLowerCase().includes(options.expression.toLowerCase())) {
      return false;
    }
    if (options.topic && item.topic !== options.topic) {
      return false;
    }
    if (options.minConfidence && (!item.confidence || item.confidence < options.minConfidence)) {
      return false;
    }
    if (options.situation && item.situation !== options.situation) {
      return false;
    }
    return true;
  });
};

// 特定の表現に関連する過去の解釈を取得（最適化版）
export const getRelatedInterpretations = (expression: string): string[] => {
  // キャッシュから直接取得（または初期化）
  const context = memoryCache.userContext || getUserContext();
  
  // ambiguousExpressionsが存在しない場合は空配列を返す
  if (!context.ambiguousExpressions) {
    context.ambiguousExpressions = [];
    return [];
  }
  
  // 類似した表現を検索
  const similarExpressions = context.ambiguousExpressions.filter(item => 
    item.expression.toLowerCase().includes(expression.toLowerCase()) ||
    expression.toLowerCase().includes(item.expression.toLowerCase())
  );
  
  // 解釈のリストを返す
  return similarExpressions.map(item => item.interpretation);
};

// 会話の文脈を生成（システムプロンプトに追加する情報）（キャッシュ対応）
export const generateContextPrompt = (): string => {
  if (typeof window === 'undefined') return '';
  
  // キャッシュされたプロンプトがあり、有効期限内なら返す
  const now = Date.now();
  if (memoryCache.contextPrompt && (now - memoryCache.contextPromptTimestamp < CACHE_TTL)) {
    return memoryCache.contextPrompt;
  }
  
  // キャッシュから直接取得（または初期化）
  const context = memoryCache.userContext || getUserContext();
  const topics = memoryCache.conversationTopics || getConversationTopics();
  
  let contextPrompt = '以下はユーザーに関する情報です：\n';
  
  // 好みの情報
  if (Object.keys(context.preferences).length > 0) {
    contextPrompt += '【ユーザーの好み】\n';
    for (const [key, value] of Object.entries(context.preferences)) {
      contextPrompt += `- ${key}: ${value}\n`;
    }
    contextPrompt += '\n';
  }
  
  // 最近の質問
  if (context.recentQuestions.length > 0) {
    contextPrompt += '【最近の質問】\n';
    context.recentQuestions.slice(0, 5).forEach((q, i) => {
      contextPrompt += `- ${q.text}\n`;
    });
    contextPrompt += '\n';
  }
  
  // 会話トピック
  if (topics.length > 0) {
    contextPrompt += '【会話トピック】\n';
    topics.slice(0, 5).forEach(topic => {
      const topicDetails = context.topics[topic];
      const details = topicDetails ? ` - ${topicDetails.details}` : '';
      contextPrompt += `- ${topic}${details}\n`;
    });
    contextPrompt += '\n';
  }
  
  // あいまい表現の解釈履歴（直近のもののみ）
  if (context.ambiguousExpressions && context.ambiguousExpressions.length > 0) {
    contextPrompt += '【あいまい表現の解釈履歴】\n';
    context.ambiguousExpressions.slice(0, 3).forEach(item => {
      contextPrompt += `- 「${item.expression}」は「${item.interpretation}」と解釈されました\n`;
    });
    contextPrompt += '\n';
  }
  
  contextPrompt += 'この情報を参考にして、ユーザーの意図や興味に合わせた応答を心がけてください。';
  
  // キャッシュに保存
  memoryCache.contextPrompt = contextPrompt;
  memoryCache.contextPromptTimestamp = now;
  
  return contextPrompt;
};

// ユーザーコンテキストをクリア
export const clearUserContext = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(USER_CONTEXT_KEY);
  localStorage.removeItem(CONVERSATION_TOPICS_KEY);
  localStorage.removeItem(AMBIGUOUS_EXPRESSIONS_KEY);
  
  // キャッシュもクリア
  memoryCache.userContext = defaultUserContext;
  memoryCache.conversationTopics = [];
  memoryCache.contextPrompt = null;
  memoryCache.contextPromptTimestamp = 0;
}; 