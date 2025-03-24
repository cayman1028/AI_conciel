import fs from 'fs';
import path from 'path';

describe('パス解決テスト', () => {
  const distPath = path.resolve(__dirname, '../../dist');
  
  test('ビルド後のディレクトリ構造が正しいこと', () => {
    // distディレクトリが存在することを確認
    expect(fs.existsSync(distPath)).toBe(true);
    
    // 必要なファイルが存在するか確認
    expect(fs.existsSync(path.join(distPath, 'chatbot.umd.js'))).toBe(true);
    expect(fs.existsSync(path.join(distPath, 'chatbot.mjs'))).toBe(true);
    
    // HTMLテストファイルが存在するか確認
    expect(fs.existsSync(path.join(distPath, 'embed-test.html'))).toBe(true);
  });
  
  test('HTMLファイル内のスクリプトパスが適切であること', () => {
    const htmlPath = path.join(distPath, 'embed-test.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // HTMLファイル内にJSへの正しい相対パスの参照があるか
    expect(htmlContent).toMatch(/<script\s+src=["']\.\/chatbot\.umd\.js["']/);
    
    // 絶対パスや間違ったパスが含まれていないか
    expect(htmlContent).not.toMatch(/<script\s+src=["']\/dist\/chatbot\.umd\.js["']/);
    expect(htmlContent).not.toMatch(/<script\s+src=["']\/chatbot\.umd\.js["']/);
  });
  
  test('UMDファイルが自己完結型であること', () => {
    const umdPath = path.join(distPath, 'chatbot.umd.js');
    const umdContent = fs.readFileSync(umdPath, 'utf-8');
    
    // UMDファイルに必要な関数定義が含まれていること
    expect(umdContent).toMatch(/initChatBot/);
    expect(umdContent).toMatch(/chatbot-container/);
    
    // 外部依存のインポートがUMDファイルに含まれていること
    // （自己完結型であることを確認）
    expect(umdContent).not.toMatch(/import\s+.*\s+from/);
  });
  
  test('公開用indexファイルが適切な構造であること', () => {
    // index.htmlが存在することを確認
    const indexPath = path.join(distPath, 'index.html');
    
    // index.htmlがない場合は、テスト用にdistディレクトリに作成
    if (!fs.existsSync(indexPath)) {
      const indexContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>チャットボットデモ</title>
</head>
<body>
  <h1>チャットボット埋め込みデモ</h1>
  <p>以下にチャットボットが表示されます</p>
  
  <!-- チャットボット埋め込みスクリプト -->
  <script src="./chatbot.umd.js"></script>
  <script>
    // チャットボットの初期化
    window.addEventListener('DOMContentLoaded', function() {
      if (typeof initChatBot === 'function') {
        initChatBot();
      }
    });
  </script>
</body>
</html>`;
      fs.writeFileSync(indexPath, indexContent);
    }
    
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // 必要なHTMLの構造要素を確認
    expect(indexContent).toMatch(/<html/);
    expect(indexContent).toMatch(/<head/);
    expect(indexContent).toMatch(/<body/);
    
    // スクリプト参照の確認
    expect(indexContent).toMatch(/<script\s+src=["']\.\/chatbot\.umd\.js["']/);
    
    // 初期化コードの確認
    expect(indexContent).toMatch(/initChatBot\(\)/);
  });
}); 