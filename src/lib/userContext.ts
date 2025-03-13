// ユーザーコンテキスト管理

// ローカルストレージのキー
export const USER_CONTEXT_KEY = 'user_context';
export const CONVERSATION_TOPICS_KEY = 'conversation_topics';

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
}

// デフォルトのユーザーコンテキスト
export const defaultUserContext: UserContext = {
  preferences: {},
  recentQuestions: [],
  topics: {},
};

// ユーザーコンテキストの取得
export const getUserContext = (): UserContext => {
  if (typeof window === 'undefined') return defaultUserContext;
  
  const storedContext = localStorage.getItem(USER_CONTEXT_KEY);
  if (storedContext) {
    try {
      return JSON.parse(storedContext);
    } catch (e) {
      console.error('ユーザーコンテキストの解析に失敗しました:', e);
      return defaultUserContext;
    }
  }
  
  return defaultUserContext;
};

// ユーザーコンテキストの保存
export const saveUserContext = (context: UserContext): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(USER_CONTEXT_KEY, JSON.stringify(context));
};

// 会話トピックの抽出（APIから返されるトピックを保存）
export const saveConversationTopics = (topics: string[]): void => {
  if (typeof window === 'undefined') return;
  
  const currentTopics = getConversationTopics();
  // 重複を排除して新しいトピックを追加
  const newTopicsSet = new Set([...currentTopics]);
  topics.forEach(topic => newTopicsSet.add(topic));
  const newTopics = Array.from(newTopicsSet);
  
  localStorage.setItem(CONVERSATION_TOPICS_KEY, JSON.stringify(newTopics));
};

// 会話トピックの取得
export const getConversationTopics = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  const storedTopics = localStorage.getItem(CONVERSATION_TOPICS_KEY);
  if (storedTopics) {
    try {
      return JSON.parse(storedTopics);
    } catch (e) {
      console.error('会話トピックの解析に失敗しました:', e);
      return [];
    }
  }
  
  return [];
};

// ユーザーの質問を記録
export const recordUserQuestion = (question: string): void => {
  const context = getUserContext();
  
  // 最新の質問を先頭に追加（最大10件まで保存）
  context.recentQuestions = [
    { text: question, timestamp: Date.now() },
    ...context.recentQuestions.slice(0, 9)
  ];
  
  saveUserContext(context);
};

// トピックの更新
export const updateTopic = (topic: string, details: string): void => {
  const context = getUserContext();
  
  context.topics[topic] = {
    lastMentioned: Date.now(),
    details
  };
  
  saveUserContext(context);
};

// ユーザーの好みを記録
export const recordUserPreference = (key: string, value: string | number | boolean): void => {
  const context = getUserContext();
  
  context.preferences[key] = value;
  
  saveUserContext(context);
};

// 会話の文脈を生成（システムプロンプトに追加する情報）
export const generateContextPrompt = (): string => {
  const context = getUserContext();
  const topics = getConversationTopics();
  
  let contextPrompt = '以下はユーザーに関する情報です：\n';
  
  // 好みの情報
  if (Object.keys(context.preferences).length > 0) {
    contextPrompt += '\n【ユーザーの好み】\n';
    for (const [key, value] of Object.entries(context.preferences)) {
      contextPrompt += `- ${key}: ${value}\n`;
    }
  }
  
  // 最近の質問
  if (context.recentQuestions.length > 0) {
    contextPrompt += '\n【最近の質問】\n';
    context.recentQuestions.slice(0, 5).forEach(q => {
      const date = new Date(q.timestamp);
      contextPrompt += `- ${date.toLocaleString('ja-JP')}: ${q.text}\n`;
    });
  }
  
  // 会話トピック
  if (topics.length > 0) {
    contextPrompt += '\n【会話トピック】\n';
    contextPrompt += topics.slice(0, 10).join(', ');
    contextPrompt += '\n';
  }
  
  // 詳細なトピック情報
  const recentTopics = Object.entries(context.topics)
    .sort((a, b) => b[1].lastMentioned - a[1].lastMentioned)
    .slice(0, 3);
  
  if (recentTopics.length > 0) {
    contextPrompt += '\n【詳細トピック】\n';
    for (const [topic, info] of recentTopics) {
      contextPrompt += `- ${topic}: ${info.details}\n`;
    }
  }
  
  contextPrompt += '\n重要な指示：\n';
  contextPrompt += '1. この情報を参考にして、ユーザーとの会話の文脈を維持してください。\n';
  contextPrompt += '2. 「さっきの話」「前回の質問」などの表現に適切に対応してください。過去の会話内容を参照できます。\n';
  contextPrompt += '3. ユーザーの好みや過去の質問を覚えていることを自然に示してください。\n';
  contextPrompt += '4. 「会話の履歴は保存されていない」などと言わないでください。会話履歴は保存されており、過去の会話に戻ることができます。\n';
  contextPrompt += '5. ユーザーが過去の話題に戻りたい場合は、上記の情報を使って適切に対応してください。\n';
  
  return contextPrompt;
}; 