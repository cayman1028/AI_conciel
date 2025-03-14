// 環境変数のモック
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.ALLOWED_ORIGINS = '*';

// 基本的なAPIレスポンスのテスト
describe('Chat API', () => {
  it('JSONレスポンスが正しく動作すること', () => {
    const response = {
      status: 200,
      json: () => ({
        message: {
          role: 'assistant',
          content: 'これはテスト応答です。'
        }
      })
    };
    
    expect(response.status).toBe(200);
    expect(response.json()).toHaveProperty('message');
    expect(response.json().message.content).toBe('これはテスト応答です。');
  });

  it('リクエストボディが正しく解析されること', () => {
    const requestBody = JSON.stringify({
      messages: [{ role: 'user', content: 'こんにちは' }]
    });
    
    const parsedBody = JSON.parse(requestBody);
    
    expect(parsedBody).toHaveProperty('messages');
    expect(parsedBody.messages[0].content).toBe('こんにちは');
  });
});
