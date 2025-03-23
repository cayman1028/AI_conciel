// メッセージの型定義
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

// 定型応答パターンの型定義
export interface ResponsePattern {
  keywords: string[];
  response: string;
} 