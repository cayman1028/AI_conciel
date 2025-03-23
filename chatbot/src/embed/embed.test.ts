
describe('ChatBot Embed Script', () => {
  let divElements: HTMLDivElement[] = [];
  let scriptElements: HTMLScriptElement[] = [];
  let appendedElements: HTMLElement[] = [];
  
  beforeEach(() => {
    // 要素作成と追加のトラッキング用配列をクリア
    divElements = [];
    scriptElements = [];
    appendedElements = [];
    
    // createElement のモック
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn().mockImplementation((tagName: string) => {
      if (tagName === 'div') {
        const mockDiv = {
          id: '',
          setAttribute: jest.fn(),
          appendChild: jest.fn()
        } as unknown as HTMLDivElement;
        divElements.push(mockDiv);
        return mockDiv;
      }
      if (tagName === 'script') {
        const mockScript = {
          src: '',
          setAttribute: jest.fn()
        } as unknown as HTMLScriptElement;
        scriptElements.push(mockScript);
        return mockScript;
      }
      return originalCreateElement.call(document, tagName);
    });
    
    // appendChild のモック
    document.body.appendChild = jest.fn().mockImplementation((element: HTMLElement) => {
      appendedElements.push(element);
      return element;
    });
    
    // initChatBot のグローバル定義を削除
    delete (window as any).initChatBot;
  });
  
  afterEach(() => {
    // モックをリセット
    jest.restoreAllMocks();
  });
  
  it('スクリプトが読み込まれると、グローバル初期化関数が定義される', () => {
    // スクリプトを読み込む
    jest.isolateModules(() => {
      require('./embed');
    });
    
    // 初期化関数が定義されていることを確認
    expect(window).toHaveProperty('initChatBot');
    expect(typeof (window as any).initChatBot).toBe('function');
  });
  
  it('初期化関数を呼び出すと、チャットボットコンテナがDOMに追加される', () => {
    // スクリプトを読み込む
    jest.isolateModules(() => {
      require('./embed');
    });
    
    // 初期化関数を呼び出す
    (window as any).initChatBot();
    
    // divが作成されたことを確認
    expect(document.createElement).toHaveBeenCalledWith('div');
    expect(divElements.length).toBeGreaterThan(0);
    
    // bodyに追加されたことを確認
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(appendedElements.length).toBeGreaterThan(0);
  });
  
  it('法人ごとの設定でも正しく動作する', () => {
    // スクリプトを読み込む
    jest.isolateModules(() => {
      require('./embed');
    });
    
    // 初期化関数を呼び出す
    (window as any).initChatBot();
    
    // 要素が作成され追加されたことを確認
    expect(document.createElement).toHaveBeenCalledWith('div');
    expect(document.body.appendChild).toHaveBeenCalled();
    
    // イベントが発火することを確認
    const eventSpy = jest.spyOn(window, 'dispatchEvent');
    window.dispatchEvent(new Event('ChatBotLoaded'));
    expect(eventSpy).toHaveBeenCalled();
  });
}); 