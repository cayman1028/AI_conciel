"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("@testing-library/dom");
require("@testing-library/jest-dom");
const React = __importStar(require("react"));
const client_1 = require("react-dom/client");
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
    let documentAddEventListenerSpy;
    let documentCreateElementSpy;
    let bodyAppendChildSpy;
    let dispatchEventSpy;
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
            expect(documentAddEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
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
            window.initChatBot();
            // DOMエレメントが作成されたか確認
            expect(documentCreateElementSpy).toHaveBeenCalledWith('div');
            expect(bodyAppendChildSpy).toHaveBeenCalled();
        });
        test('Reactコンポーネントがレンダリングされること', () => {
            // 初期化関数を実行
            window.initChatBot();
            // Reactのレンダリングが実行されたか確認
            expect(client_1.createRoot).toHaveBeenCalled();
            expect(React.createElement).toHaveBeenCalledWith('ChatBot');
        });
        test('ChatBotLoadedイベントが発火されること', () => {
            // 初期化関数を実行
            window.initChatBot();
            // カスタムイベントが発火されたか確認
            expect(dispatchEventSpy).toHaveBeenCalled();
            expect(dispatchEventSpy.mock.calls[0][0].type).toBe('ChatBotLoaded');
        });
    });
    test('DOMContentLoadedイベント発火時にinitChatBot関数が呼ばれること', () => {
        // モジュールをインポート
        require('./embed');
        // initChatBot関数をスパイ
        const initChatBotSpy = jest.spyOn(window, 'initChatBot');
        // DOMContentLoadedイベントをシミュレート
        const domLoadedEvent = new Event('DOMContentLoaded');
        (0, dom_1.fireEvent)(document, domLoadedEvent);
        // initChatBot関数が呼ばれたことを確認
        expect(initChatBotSpy).toHaveBeenCalled();
    });
});
