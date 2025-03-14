import { expect, test } from '@playwright/test';

test.describe('基本的なE2Eテスト', () => {
  test('ホームページが正しく表示されること', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    
    // ページのタイトルを確認
    await expect(page).toHaveTitle(/AI Conciel/);
    
    // 必要な要素が表示されていることを確認
    await expect(page.locator('body')).toBeVisible();
  });
}); 