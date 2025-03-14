# テストカバレッジ向上計画

## 現状（2023年XX月XX日）

現在のテストカバレッジは約20%で、目標の70%には達していません。

- **ステートメントカバレッジ**: 21.57%（目標: 70%）
- **ブランチカバレッジ**: 10.22%（目標: 70%）
- **関数カバレッジ**: 23.78%（目標: 70%）
- **行カバレッジ**: 20.22%（目標: 70%）

## 主な課題

1. **MSWの問題**
   - `BroadcastChannel`のモックが必要
   - NextRequestとNextResponseのモック問題

2. **userContextのテスト問題**
   - メモリキャッシュと`localStorage`の同期問題
   - テスト間の状態の漏洩

3. **ChatWidgetのテスト問題**
   - 複雑なコンポーネントのテストがスキップされている
   - UIイベントとストリーミングレスポンスのモック

4. **APIルートのテスト不足**
   - `app/api/chat/route.ts`のカバレッジが0%

## 改善計画

### フェーズ1：基本的なテスト修正（1-2週間）

1. **失敗しているテストの修正**
   - `userContext.test.ts`のメモリキャッシュ問題を解決
   - MSW依存関係の問題を解決

2. **テスト環境の整備**
   - `jest.setup.js`の改善（必要なモックの追加）
   - テストヘルパー関数の作成

### フェーズ2：コア機能の抽象化（2-4週間）

1. **外部依存の抽象化**
   - ストレージサービスの抽象化（localStorage依存の分離）
   - APIクライアントの抽象化（fetch依存の分離）

2. **依存注入の導入**
   - `userContext.ts`に依存注入を導入
   - `companyConfig.ts`に依存注入を導入

### フェーズ3：モジュール分割（3-6週間）

1. **大きなモジュールの分割**
   - `userContext.ts`を複数の小さなモジュールに分割
   - `ChatWidget.tsx`をより小さなコンポーネントに分割

2. **インターフェースの明確化**
   - 各モジュール間の明確なインターフェース定義
   - 型定義の強化

### フェーズ4：テストカバレッジ向上（継続的）

1. **優先順位付けされたテスト追加**
   - APIルートのテスト追加
   - ユーザーコンテキスト機能のテスト強化
   - UIコンポーネントのテスト強化

2. **エッジケースのテスト**
   - エラー処理のテスト
   - 境界値のテスト

## カバレッジ目標

- **3ヶ月後**: 30%
- **6ヶ月後**: 50%
- **12ヶ月後**: 70%

## 実装のポイント

1. **変更の範囲を限定**
   - 一度に1つのモジュールに集中
   - 公開APIは維持しつつ、内部実装を改善

2. **テストファーストアプローチ**
   - リファクタリング前にテストを書く
   - 既存の動作を保証するテストを追加してから構造変更

3. **継続的な統合**
   - 小さな変更を頻繁にマージ
   - 長期間のブランチを避ける

## 進捗状況

### 2023年XX月XX日（初期状態）
- BroadcastChannelのモックを追加
- userContextのテストを改善（メモリキャッシュのリセット機能）
- ChatWidgetのテストを改善（themeStylesのモック）
- chat.test.tsのNextRequest/NextResponseモックを改善

### 2023年XX月XX日（フェーズ1の進捗 - 1回目）
- userContext.test.tsのメモリキャッシュ問題を完全に解決
  - recordUserQuestion関数のテストを修正
  - テスト間の状態漏洩を防止するリセット機能を追加
- jest.setup.jsにNextRequestとNextResponseのモックを追加
- APIルートのテストを追加（src/__tests__/api/chatRoute.test.ts）
  - 通常のレスポンスとストリーミングレスポンスのテスト
  - エラーハンドリングのテスト
- テストヘルパー関数を作成（src/__tests__/helpers/testUtils.ts）
  - モックユーザーコンテキスト作成関数
  - モックメッセージ作成関数
  - localStorageモック関数
  - fetchモック関数
  - ストリームレスポンスモック関数

### 2023年XX月XX日（フェーズ1の進捗 - 2回目）
- ChatWidgetのテストを改善
  - scrollIntoViewメソッドのモックを追加
  - スキップされていたテストを修正
  - テストケースを簡略化して安定性を向上
- APIルートのテストを改善
  - NextRequestとNextResponseのモックを改善
  - OpenAIクライアントのモックを改善（dangerouslyAllowBrowserオプションを追加）

## 次のステップ

1. **ストレージサービスの抽象化**
   - インターフェース設計
   ```typescript
   interface StorageService {
     getItem(key: string): string | null;
     setItem(key: string, value: string): void;
     removeItem(key: string): void;
     clear(): void;
   }
   ```
   - 実装クラス
   ```typescript
   class LocalStorageService implements StorageService {
     getItem(key: string): string | null {
       return localStorage.getItem(key);
     }
     setItem(key: string, value: string): void {
       localStorage.setItem(key, value);
     }
     removeItem(key: string): void {
       localStorage.removeItem(key);
     }
     clear(): void {
       localStorage.clear();
     }
   }
   ```
   - モック実装
   ```typescript
   class MockStorageService implements StorageService {
     private store: Record<string, string> = {};
     
     getItem(key: string): string | null {
       return this.store[key] || null;
     }
     setItem(key: string, value: string): void {
       this.store[key] = value;
     }
     removeItem(key: string): void {
       delete this.store[key];
     }
     clear(): void {
       this.store = {};
     }
   }
   ```

2. **APIクライアントの抽象化**
   - インターフェース設計
   ```typescript
   interface ApiClient {
     post(url: string, data: any): Promise<any>;
     get(url: string): Promise<any>;
   }
   ```
   - 実装クラス
   ```typescript
   class FetchApiClient implements ApiClient {
     async post(url: string, data: any): Promise<any> {
       const response = await fetch(url, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(data),
       });
       return response.json();
     }
     
     async get(url: string): Promise<any> {
       const response = await fetch(url);
       return response.json();
     }
   }
   ```
   - モック実装
   ```typescript
   class MockApiClient implements ApiClient {
     private mockResponses: Record<string, any> = {};
     
     setMockResponse(url: string, data: any): void {
       this.mockResponses[url] = data;
     }
     
     async post(url: string, data: any): Promise<any> {
       return this.mockResponses[url] || {};
     }
     
     async get(url: string): Promise<any> {
       return this.mockResponses[url] || {};
     }
   }
   ```

3. **userContextモジュールの改善**
   - 依存注入を導入
   ```typescript
   export function createUserContext(storageService: StorageService) {
     // 実装
   }
   ``` 