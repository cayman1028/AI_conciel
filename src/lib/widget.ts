export interface AIコンシェルConfig {
  apiKey: string;
  config?: {
    theme?: {
      primary?: string;
      font?: string;
    };
    language?: string;
  };
}

interface AIコンシェルWindow extends Window {
  AIコンシェル: {
    init: (config: AIコンシェルConfig) => void;
  };
}

declare const window: AIコンシェルWindow;

const initWidget = (config: AIコンシェルConfig) => {
  const script = document.createElement('script');
  script.src = 'https://aiconciel.github.io/widget.js';
  script.async = true;
  script.onload = () => {
    const container = document.createElement('div');
    container.id = 'ai-conciel-widget';
    document.body.appendChild(container);

    // ここでReactコンポーネントをマウント
    // 注: 実際の実装ではReactのhydrateやcreateRootを使用
  };
  document.head.appendChild(script);
};

window.AIコンシェル = {
  init: initWidget,
}; 