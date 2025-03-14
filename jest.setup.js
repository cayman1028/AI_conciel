// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// モックの設定
// 環境変数のモック
process.env = {
  ...process.env,
  OPENAI_API_KEY: 'test-api-key',
  ALLOWED_ORIGINS: '*',
};

// Jest setup file
const { TextEncoder, TextDecoder } = require('util');

// TextEncoderとTextDecoderをグローバルに設定
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// MSWに必要なグローバルオブジェクト
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new Headers(init.headers);
      this.type = 'basic';
      this.url = '';
      this.ok = this.status >= 200 && this.status < 300;
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body));
    }
    
    text() {
      return Promise.resolve(this.body);
    }
  };
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    #url;
    #method;
    #headers;
    #body;
    
    constructor(input, init = {}) {
      this.#url = input;
      this.#method = init.method || 'GET';
      this.#headers = new Headers(init.headers);
      this.#body = init.body || null;
    }
    
    get url() {
      return this.#url;
    }
    
    get method() {
      return this.#method;
    }
    
    get headers() {
      return this.#headers;
    }
    
    get body() {
      return this.#body;
    }
  };
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.headers = {};
      if (init) {
        Object.keys(init).forEach(key => {
          this.headers[key.toLowerCase()] = init[key];
        });
      }
    }
    
    append(name, value) {
      this.headers[name.toLowerCase()] = value;
    }
    
    delete(name) {
      delete this.headers[name.toLowerCase()];
    }
    
    get(name) {
      return this.headers[name.toLowerCase()] || null;
    }
    
    has(name) {
      return name.toLowerCase() in this.headers;
    }
    
    set(name, value) {
      this.headers[name.toLowerCase()] = value;
    }
  };
}

// ReadableStreamのモック
if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = class ReadableStream {
    constructor(source) {
      this.source = source;
      if (source && source.start) {
        this.controller = {
          enqueue: jest.fn(),
          close: jest.fn(),
          error: jest.fn(),
        };
        source.start(this.controller);
      }
    }
    
    getReader() {
      return {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined }),
        cancel: jest.fn(),
        releaseLock: jest.fn(),
        closed: Promise.resolve(),
      };
    }
  };
}

// BroadcastChannelのモック追加
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
      this.onmessage = null;
      this.onmessageerror = null;
    }
    
    postMessage(message) {
      // メッセージ送信のモック
      if (this.onmessage) {
        const event = { data: message };
        setTimeout(() => this.onmessage(event), 0);
      }
    }
    
    close() {
      // チャンネルを閉じるモック
    }
  };
}

// Next.js App Router APIルート用のモック
// NextRequestのモック
class NextRequestMock {
  constructor(input, init = {}) {
    this.url = typeof input === 'string' ? input : input.url;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers);
    this.body = init.body || null;
    this.nextUrl = new URL(this.url);
    this.cookies = {
      get: jest.fn().mockReturnValue(null),
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn().mockReturnValue(false),
    };
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }

  text() {
    return Promise.resolve(this.body);
  }

  clone() {
    return new NextRequestMock(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
    });
  }
}

// NextResponseのモック
class NextResponseMock {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || '';
    this.headers = new Headers(options.headers);
    this.cookies = {
      get: jest.fn().mockReturnValue(null),
      getAll: jest.fn().mockReturnValue([]),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn().mockReturnValue(false),
    };
  }

  static json(data, options = {}) {
    const body = JSON.stringify(data);
    return new NextResponseMock(body, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    });
  }

  static redirect(url, options = {}) {
    return new NextResponseMock(null, {
      ...options,
      status: 302,
      headers: {
        ...options.headers,
        Location: url,
      },
    });
  }
}

// グローバルにNextRequestとNextResponseを設定
global.NextRequest = NextRequestMock;
global.NextResponse = NextResponseMock;

// localStorageのモック
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

// localStorageをグローバルに設定
global.localStorage = new LocalStorageMock();

// fetchのモック
global.fetch = jest.fn();

// IntersectionObserverのモック
class IntersectionObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

global.IntersectionObserver = IntersectionObserverMock;

// matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // 非推奨
    removeListener: jest.fn(), // 非推奨
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// テスト後のクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
}); 