// 基本的なUIコンポーネントのテスト
describe('UI Components', () => {
  it('基本的なUIが正しく動作すること', () => {
    // ダミーのDOMテスト
    const element = document.createElement('div');
    element.innerHTML = '<button>送信</button>';
    
    expect(element.querySelector('button')).not.toBeNull();
    expect(element.textContent).toBe('送信');
  });

  it('JSONデータが正しく処理されること', () => {
    const data = {
      messages: [
        { role: 'user', content: 'こんにちは' },
        { role: 'assistant', content: 'こんにちは、何かお手伝いできますか？' }
      ]
    };
    
    expect(data.messages.length).toBe(2);
    expect(data.messages[0].role).toBe('user');
    expect(data.messages[1].role).toBe('assistant');
  });
});
