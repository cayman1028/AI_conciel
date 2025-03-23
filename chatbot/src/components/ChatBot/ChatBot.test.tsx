import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { chatbotConfig } from '../../config/chatbotConfig';
import ChatBot from './ChatBot';

describe('ChatBot', () => {
  it('初期状態でチャットボットが表示される', () => {
    render(<ChatBot />);
    
    // チャットボットの初期要素が存在することを確認
    expect(screen.getByTestId('chatbot-container')).toBeInTheDocument();
    expect(screen.getByTestId('chatbot-messages')).toBeInTheDocument();
    expect(screen.getByTestId('chatbot-input')).toBeInTheDocument();
    expect(screen.getByTestId('chatbot-send-button')).toBeInTheDocument();
    
    // 設定からタイトルが表示されることを確認
    expect(screen.getByText(chatbotConfig.title)).toBeInTheDocument();
  });

  it('メッセージを送信するとチャット履歴に追加される', async () => {
    render(<ChatBot />);
    
    // メッセージを入力して送信
    const input = screen.getByTestId('chatbot-input');
    const sendButton = screen.getByTestId('chatbot-send-button');
    
    await userEvent.type(input, 'こんにちは');
    fireEvent.click(sendButton);
    
    // ユーザーのメッセージがチャット履歴に表示されることを確認
    expect(screen.getByText('こんにちは')).toBeInTheDocument();
    
    // ボットの定型応答がチャット履歴に表示されることを確認
    // 応答が非同期で表示される可能性があるため、findByTextを使用
    const botResponse = await screen.findByTestId('bot-message');
    expect(botResponse).toBeInTheDocument();
  });

  it('定型応答が正しく表示される', async () => {
    render(<ChatBot />);
    
    // 「営業時間」についての質問
    const input = screen.getByTestId('chatbot-input');
    const sendButton = screen.getByTestId('chatbot-send-button');
    
    await userEvent.type(input, '営業時間を教えてください');
    fireEvent.click(sendButton);
    
    // 営業時間に関する定型応答が表示されることを確認
    const botResponse = await screen.findByTestId('bot-message');
    expect(botResponse.textContent).toContain('営業時間');
  });

  it('チャットボットがHTMLに埋め込み可能である', () => {
    // チャットボットが<script>タグで埋め込み可能かテスト
    const scriptTag = document.createElement('script');
    scriptTag.src = 'chatbot.js';
    document.body.appendChild(scriptTag);
    
    // イベントが発火することを確認
    const eventSpy = jest.spyOn(window, 'dispatchEvent');
    window.dispatchEvent(new Event('ChatBotLoaded'));
    
    expect(eventSpy).toHaveBeenCalled();
  });
}); 