import axios from 'axios';
import fs from 'fs';
import path from 'path';

describe('デプロイ後のテスト', () => {
  // デプロイ先のURLを環境変数から取得、またはデフォルト値を使用
  const deployedUrl = process.env.DEPLOYED_URL || 'https://chatbot-demo.vercel.app';
  
  // タイムアウトを長めに設定
  jest.setTimeout(30000);
  
  test('デプロイされたサイトにアクセスできること', async () => {
    // GETリクエストを送信
    const response = await axios.get(deployedUrl);
    
    // ステータスコードが200であることを確認
    expect(response.status).toBe(200);
    
    // HTMLコンテンツを取得
    const html = response.data;
    
    // HTMLに期待する要素が含まれているか確認
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('チャットボット');
  });
  
  test('JavaScriptファイルが正しく配信されること', async () => {
    // JSファイルのパスを取得
    const jsFilePath = `${deployedUrl}/chatbot.umd.js`;
    
    // GETリクエストを送信
    const response = await axios.get(jsFilePath);
    
    // ステータスコードが200であることを確認
    expect(response.status).toBe(200);
    
    // Content-Typeがjavascriptであることを確認
    expect(response.headers['content-type']).toMatch(/javascript/);
    
    // JavaScriptコンテンツを取得
    const jsContent = response.data;
    
    // 期待する関数が含まれているか確認
    expect(typeof jsContent).toBe('string');
    expect(jsContent).toContain('initChatBot');
  });
  
  test('CORSヘッダーが正しく設定されていること', async () => {
    // OPTIONSリクエスト（プリフライトリクエスト）を送信
    const response = await axios.options(deployedUrl, {
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    // CORS関連のヘッダーが存在することを確認
    expect(response.headers['access-control-allow-origin']).toBeTruthy();
  });
  
  test('デプロイ情報を記録する', () => {
    // 現在の時刻を取得
    const deployTime = new Date().toISOString();
    
    // デプロイ情報を作成
    const deployInfo = {
      url: deployedUrl,
      time: deployTime,
      environment: process.env.NODE_ENV || 'development',
      success: true
    };
    
    // デプロイ情報をJSONとして文字列化
    const deployInfoJson = JSON.stringify(deployInfo, null, 2);
    
    // ファイルに書き込む（テスト目的で）
    const deployLogPath = path.join(process.cwd(), 'deploy-log.json');
    fs.writeFileSync(deployLogPath, deployInfoJson);
    
    // ファイルが存在することを確認
    expect(fs.existsSync(deployLogPath)).toBe(true);
  });
}); 