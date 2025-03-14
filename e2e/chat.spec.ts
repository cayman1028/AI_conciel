import { expect, test } from '@playwright/test';

test.describe('チャット機能のE2Eテスト', () => {
  test('チャットウィジェットが正しく表示されること', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    
    // チャットウィジェットが表示されるまで待機
    const chatWidget = page.locator('[data-testid="chat-widget"]');
    await expect(chatWidget).toBeVisible({ timeout: 10000 });
  });

  test('メッセージを送信できること', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    
    // チャット入力欄が表示されるまで待機
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    
    // メッセージを入力
    await chatInput.fill('こんにちは');
    
    // 送信ボタンをクリック
    const sendButton = page.locator('[data-testid="send-button"]');
    await sendButton.click();
    
    // 送信したメッセージが表示されることを確認
    const userMessage = page.locator('[data-testid="user-message"]').filter({ hasText: 'こんにちは' });
    await expect(userMessage).toBeVisible({ timeout: 10000 });
    
    // レスポンスが返ってくることを確認（タイムアウトを長めに設定）
    const assistantMessage = page.locator('[data-testid="assistant-message"]').first();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });
  });
}); 