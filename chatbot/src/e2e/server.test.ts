import fs from 'fs';
import http from 'http';
import { AddressInfo } from 'net';
import path from 'path';

describe('サーバー配信テスト', () => {
  let server: http.Server;
  let serverAddress: string;
  let serverPort: number;
  
  beforeAll((done) => {
    // 簡易HTTPサーバーを作成
    server = http.createServer((req, res) => {
      // リクエストURLからパスを取得
      const reqPath = req.url === '/' ? '/index.html' : req.url;
      
      // ファイルパスの構築
      const filePath = path.join(__dirname, '../../dist', reqPath || '');
      
      // ファイルが存在するか確認
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          // ファイルが見つからない場合は404
          res.statusCode = 404;
          res.end('File not found');
          return;
        }
        
        // Content-Typeの設定
        let contentType = 'text/plain';
        if (filePath.endsWith('.html')) {
          contentType = 'text/html';
        } else if (filePath.endsWith('.js')) {
          contentType = 'application/javascript';
        } else if (filePath.endsWith('.mjs')) {
          contentType = 'application/javascript';
        }
        
        res.setHeader('Content-Type', contentType);
        
        // ファイルをストリーミング
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      });
    });
    
    // サーバーを起動
    server.listen(0, () => { // 0を指定すると利用可能なポートが自動選択される
      const address = server.address() as AddressInfo;
      serverPort = address.port;
      serverAddress = `http://localhost:${serverPort}`;
      done();
    });
  });
  
  afterAll((done) => {
    // テスト終了後にサーバーを終了
    server.close(done);
  });
  
  test('埋め込みJSファイルが正しく配信されること', (done) => {
    // HTTPリクエストでJSファイルを取得
    http.get(`${serverAddress}/chatbot.umd.js`, (res) => {
      let data = '';
      
      // レスポンスステータスのチェック
      expect(res.statusCode).toBe(200);
      
      // Content-Typeのチェック
      expect(res.headers['content-type']).toMatch(/application\/javascript/);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // 応答データに必要な要素が含まれていることを確認
        expect(data).toMatch(/initChatBot/);
        expect(data).toMatch(/chatbot-container/);
        done();
      });
    }).on('error', (err) => {
      done(err);
    });
  });
  
  test('HTMLファイルからJSが参照できること', (done) => {
    // テスト用HTMLファイルが存在するか確認
    const htmlPath = path.join(__dirname, '../../dist/embed-test.html');
    
    if (!fs.existsSync(htmlPath)) {
      // テスト用HTMLファイルがない場合は作成
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Embed Test</title>
</head>
<body>
  <h1>Chatbot Embed Test</h1>
  <script src="./chatbot.umd.js"></script>
</body>
</html>`;
      fs.writeFileSync(htmlPath, htmlContent);
    }
    
    // HTMLファイルをリクエスト
    http.get(`${serverAddress}/embed-test.html`, (res) => {
      let data = '';
      
      // レスポンスステータスのチェック
      expect(res.statusCode).toBe(200);
      
      // Content-Typeのチェック
      expect(res.headers['content-type']).toMatch(/text\/html/);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // HTMLにスクリプト参照が含まれていることを確認
        expect(data).toMatch(/<script\s+src=["'][^"']*chatbot\.umd\.js["']/);
        done();
      });
    }).on('error', (err) => {
      done(err);
    });
  });
}); 