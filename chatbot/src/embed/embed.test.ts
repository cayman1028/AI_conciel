import { fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

// モック
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn()
  }))
}));

jest.mock('react', () => ({
  createElement: jest.fn()
}));

jest.mock('../components/ChatBot/ChatBot', () => 'ChatBot');

describe('embed.ts', () => {
  let documentAddEventListenerSpy: jest.SpyInstance;
  let documentCreateElementSpy: jest.SpyInstance;
  let bodyAppendChildSpy: jest.SpyInstance;
  let dispatchEventSpy: jest.SpyInstance;

  beforeEach(() => {
    // DOMスパイをセットアップ
    documentAddEventListenerSpy = jest.spyOn(document, 'addEventListener');
    documentCreateElementSpy = jest.spyOn(document, 'createElement');
    bodyAppendChildSpy = jest.spyOn(document.body, 'appendChild');
    dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    
    // モックをリセット
    jest.clearAllMocks();
  });

  afterEach(() => {
    // スパイをリストア
    documentAddEventListenerSpy.mockRestore();
    documentCreateElementSpy.mockRestore();
    bodyAppendChildSpy.mockRestore();
    dispatchEventSpy.mockRestore();
  });

  describe('初期化', () => {
    test('DOMContentLoadedイベントリスナーが登録されること', () => {
      // モジュールをインポート
      require('./embed');
      
      // DOMContentLoadedイベントリスナーが登録されていることを確認
      expect(documentAddEventListenerSpy).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      );
    });

    test('initChatBot関数がグローバルスコープに登録されること', () => {
      // モジュールをインポート
      require('./embed');
      
      // グローバル関数が定義されていることを確認
      expect(window).toHaveProperty('initChatBot');
    });
  });

  describe('initChatBot関数', () => {
    beforeEach(() => {
      // モジュールをインポートして初期化関数を取得
      require('./embed');
    });

    test('コンテナ要素が作成されDOMに追加されること', () => {
      // 初期化関数を実行
      (window as any).initChatBot();
      
      // DOMエレメントが作成されたか確認
      expect(documentCreateElementSpy).toHaveBeenCalledWith('div');
      expect(bodyAppendChildSpy).toHaveBeenCalled();
    });

    test('Reactコンポーネントがレンダリングされること', () => {
      // 初期化関数を実行
      (window as any).initChatBot();
      
      // Reactのレンダリングが実行されたか確認
      expect(createRoot).toHaveBeenCalled();
      expect(React.createElement).toHaveBeenCalledWith('ChatBot');
    });

    test('ChatBotLoadedイベントが発火されること', () => {
      // 初期化関数を実行
      (window as any).initChatBot();
      
      // カスタムイベントが発火されたか確認
      expect(dispatchEventSpy).toHaveBeenCalled();
      expect(dispatchEventSpy.mock.calls[0][0].type).toBe('ChatBotLoaded');
    });
  });

  test('DOMContentLoadedイベント発火時にinitChatBot関数が呼ばれること', () => {
    // モジュールをインポート
    require('./embed');
    
    // initChatBot関数をスパイ
    const initChatBotSpy = jest.spyOn(window as any, 'initChatBot');
    
    // DOMContentLoadedイベントをシミュレート
    const domLoadedEvent = new Event('DOMContentLoaded');
    fireEvent(document, domLoadedEvent);
    
    // initChatBot関数が呼ばれたことを確認
    expect(initChatBotSpy).toHaveBeenCalled();
  });
}); 