import { describe, expect, it } from '@jest/globals';
import { ChatSession, MessageType } from '../../services/chatService';

describe('チャットサービス', () => {
  it('新しいチャットセッションが正しく初期化されること', () => {
    const session = new ChatSession();
    expect(session.messages).toHaveLength(1); // 初期メッセージが含まれる
    expect(session.messages[0].type).toBe(MessageType.SYSTEM);
    expect(session.messages[0].content).toBe('いらっしゃいませ！どのようなご用件でしょうか？');
  });

  it('ユーザーメッセージが追加されること', () => {
    const session = new ChatSession();
    session.addUserMessage('こんにちは');
    
    expect(session.messages).toHaveLength(2);
    expect(session.messages[1].type).toBe(MessageType.USER);
    expect(session.messages[1].content).toBe('こんにちは');
  });

  it('システムメッセージが追加されること', () => {
    const session = new ChatSession();
    session.addSystemMessage('こんにちは！どのようなご用件でしょうか？');
    
    expect(session.messages).toHaveLength(2);
    expect(session.messages[1].type).toBe(MessageType.SYSTEM);
    expect(session.messages[1].content).toBe('こんにちは！どのようなご用件でしょうか？');
  });

  it('ユーザーメッセージに対して自動的に回答が生成されること', () => {
    const session = new ChatSession();
    session.sendMessage('こんにちは');
    
    // ユーザーメッセージとシステムの回答が追加されているか
    expect(session.messages).toHaveLength(3);
    expect(session.messages[1].type).toBe(MessageType.USER);
    expect(session.messages[1].content).toBe('こんにちは');
    expect(session.messages[2].type).toBe(MessageType.SYSTEM);
    expect(session.messages[2].content).toBe('こんにちは！どのようなご用件でしょうか？');
  });
}); 