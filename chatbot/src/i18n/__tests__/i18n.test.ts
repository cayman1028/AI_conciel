import { availableLanguages, I18nProvider, useTranslation } from '../i18n';

describe('多言語対応テスト', () => {
  describe('I18nProvider', () => {
    test('I18nProviderが存在すること', () => {
      expect(I18nProvider).toBeDefined();
    });
  });

  describe('翻訳機能', () => {
    test('useTranslation関数が存在すること', () => {
      expect(useTranslation).toBeDefined();
    });

    test('利用可能な言語が定義されていること', () => {
      expect(availableLanguages).toBeDefined();
      expect(Array.isArray(availableLanguages)).toBe(true);
      expect(availableLanguages.length).toBeGreaterThan(0);
      expect(availableLanguages).toContain('ja');
      expect(availableLanguages).toContain('en');
    });
  });

  describe('翻訳辞書', () => {
    test('日本語翻訳リソースが利用可能であること', async () => {
      const { getTranslation } = await import('../i18n');
      const jaTranslations = await getTranslation('ja');
      
      expect(jaTranslations).toBeDefined();
      expect(jaTranslations.title).toBeDefined();
      expect(jaTranslations.placeholder).toBeDefined();
      expect(jaTranslations.sendButtonText).toBeDefined();
    });

    test('英語翻訳リソースが利用可能であること', async () => {
      const { getTranslation } = await import('../i18n');
      const enTranslations = await getTranslation('en');
      
      expect(enTranslations).toBeDefined();
      expect(enTranslations.title).toBeDefined();
      expect(enTranslations.placeholder).toBeDefined();
      expect(enTranslations.sendButtonText).toBeDefined();
    });
  });

  describe('言語切り替え機能', () => {
    test('言語を切り替えられること', async () => {
      const { setLanguage, getCurrentLanguage } = await import('../i18n');
      
      // 初期値は日本語
      expect(getCurrentLanguage()).toBe('ja');
      
      // 英語に切り替え
      setLanguage('en');
      expect(getCurrentLanguage()).toBe('en');
      
      // 日本語に戻す
      setLanguage('ja');
      expect(getCurrentLanguage()).toBe('ja');
    });

    test('無効な言語コードは無視されること', async () => {
      const { setLanguage, getCurrentLanguage } = await import('../i18n');
      
      const initialLang = getCurrentLanguage();
      
      // @ts-ignore
      setLanguage('invalid_language_code');
      
      // 言語は変更されていないはず
      expect(getCurrentLanguage()).toBe(initialLang);
    });
  });
}); 