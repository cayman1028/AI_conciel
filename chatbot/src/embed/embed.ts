/**
 * チャットボットを法人サイトに埋め込むためのスクリプト
 */

// パス解決関数
function resolveBasePath(): string {
  // スクリプトタグから現在のスクリプトパスを取得
  if (typeof document !== 'undefined') {
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    
    // スクリプトのsrc属性を取得
    const scriptSrc = currentScript.getAttribute('src') || '';
    
    // パスの最後のスラッシュまでを取得
    const lastSlashIndex = scriptSrc.lastIndexOf('/');
    if (lastSlashIndex >= 0) {
      return scriptSrc.substring(0, lastSlashIndex + 1);
    }
  }
  
  // パスが見つからない場合は相対パスを返す
  return './';
}

// グローバルな初期化関数を定義
(window as any).initChatBot = (config?: any) => {
  const basePath = resolveBasePath();
  const defaultConfig = {
    position: 'bottom-right',
    width: '350px',
    height: '500px'
  };
  
  // 設定をマージ
  const mergedConfig = { ...defaultConfig, ...config };
  
  // チャットボットコンテナを作成
  const chatbotContainer = document.createElement('div');
  chatbotContainer.id = 'chatbot-container';
  chatbotContainer.style.position = 'fixed';
  
  // 位置の設定
  if (mergedConfig.position === 'bottom-right') {
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.right = '20px';
  } else if (mergedConfig.position === 'bottom-left') {
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.left = '20px';
  }
  
  // サイズの設定
  chatbotContainer.style.width = mergedConfig.width;
  chatbotContainer.style.height = mergedConfig.height;
  
  // テスト用の表示
  chatbotContainer.textContent = 'ChatBot Loaded';
  chatbotContainer.style.backgroundColor = '#f0f0f0';
  chatbotContainer.style.border = '1px solid #ccc';
  chatbotContainer.style.borderRadius = '8px';
  chatbotContainer.style.padding = '10px';
  chatbotContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
  
  // ボディに追加
  document.body.appendChild(chatbotContainer);
  
  // チャットボット読み込み完了イベントを発火
  window.dispatchEvent(new Event('ChatBotLoaded'));
  
  // ログ出力（開発環境でのデバッグ用）
  console.log(`ChatBot initialized with base path: ${basePath}`);
};

// DOMContentLoadedイベントでチャットボットを自動初期化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    // 自動初期化フラグがfalseでない場合のみ初期化
    const autoInit = (window as any).CHATBOT_AUTO_INIT !== false;
    if (autoInit) {
      (window as any).initChatBot();
    }
  });
}

// 初期化関数をエクスポート
export function initChatBot(config?: any) {
  if (typeof window !== 'undefined') {
    (window as any).initChatBot(config);
  }
}
      