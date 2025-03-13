// ユーザーコンテキスト管理

// ローカルストレージのキー
export const USER_CONTEXT_KEY = 'user_context';
export const CONVERSATION_TOPICS_KEY = 'conversation_topics';
export const AMBIGUOUS_EXPRESSIONS_KEY = 'ambiguous_expressions';

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
  ambiguousExpressions: {
    expression: string;
    interpretation: string;
    timestamp: number;
    confidence?: number;
    contextFactors?: string[];
    topic?: string;
    situation?: string;
  }[];
}

// デフォルトのユーザーコンテキスト
export const defaultUserContext: UserContext = {
  preferences: {},
  recentQuestions: [],
  topics: {},
  ambiguousExpressions: [],
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

// あいまい表現を記録
export const recordAmbiguousExpression = (
  expression: string, 
  interpretation: string, 
  confidence?: number, 
  contextFactors?: string[],
  topic?: string
): void => {
  const context = getUserContext();
  
  // 現在の状況（時間帯）を判断
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
  
  saveUserContext(context);
};

// あいまい表現の取得（オプションでフィルタリング）
export const getAmbiguousExpressions = (options?: {
  expression?: string;
  topic?: string;
  minConfidence?: number;
  situation?: string;
}): { 
  expression: string; 
  interpretation: string; 
  timestamp: number;
  confidence?: number;
  contextFactors?: string[];
  topic?: string;
  situation?: string;
}[] => {
  const context = getUserContext();
  
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

// 特定の表現に関連する過去の解釈を取得
export const getRelatedInterpretations = (expression: string): string[] => {
  const context = getUserContext();
  
  // 類似した表現を検索
  const similarExpressions = context.ambiguousExpressions.filter(item => 
    item.expression.toLowerCase().includes(expression.toLowerCase()) ||
    expression.toLowerCase().includes(item.expression.toLowerCase())
  );
  
  // 解釈のリストを返す
  return similarExpressions.map(item => item.interpretation);
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
  
  // あいまい表現の解釈履歴
  if (context.ambiguousExpressions && context.ambiguousExpressions.length > 0) {
    contextPrompt += '\n【あいまい表現の解釈履歴】\n';
    context.ambiguousExpressions.slice(0, 5).forEach(item => {
      let expressionInfo = `- 表現: "${item.expression}" → 解釈: "${item.interpretation}"`;
      
      // 追加情報がある場合は表示
      if (item.confidence) {
        expressionInfo += ` (確信度: ${Math.round(item.confidence * 100)}%)`;
      }
      if (item.topic) {
        expressionInfo += ` [トピック: ${item.topic}]`;
      }
      if (item.situation) {
        expressionInfo += ` [状況: ${item.situation}]`;
      }
      
      contextPrompt += expressionInfo + '\n';
    });
  }
  
  contextPrompt += '\n重要な指示：\n';
  contextPrompt += '1. この情報を参考にして、ユーザーとの会話の文脈を維持してください。\n';
  contextPrompt += '2. "さっきの話" "前回の質問"などの表現に適切に対応してください。過去の会話内容を参照できます。\n';
  contextPrompt += '3. ユーザーの好みや過去の質問を覚えていることを自然に示してください。\n';
  contextPrompt += '4. "会話の履歴は保存されていない"などと言わないでください。会話履歴は保存されており、過去の会話に戻ることができます。\n';
  contextPrompt += '5. ユーザーが過去の話題に戻りたい場合は、上記の情報を使って適切に対応してください。\n';
  contextPrompt += '6. 日本語特有のあいまいな表現や婉曲表現を理解し、適切に解釈してください。"ちょっと" "もしよかったら" "～かもしれません"などの表現の真意を汲み取ってください。\n';
  contextPrompt += '7. 遠回しな表現や断りの表現（"難しいかもしれません" "検討します"など）の真意を理解し、適切に応答してください。\n';
  contextPrompt += '8. 過去に解釈したあいまい表現の履歴を参考にして、一貫性のある応答をしてください。特に同じトピックや状況での解釈を優先してください。\n';
  contextPrompt += '9. 文脈や状況に応じて、同じ表現でも異なる解釈が必要な場合があることを理解してください。例えば、ビジネス文脈での"検討します"と友人との会話での"検討します"は異なる意味を持つ可能性があります。\n';
  
  return contextPrompt;
}; 