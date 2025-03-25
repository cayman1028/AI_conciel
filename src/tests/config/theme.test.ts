import { getTheme } from '../../config/theme';

describe('Theme Configuration', () => {
  it('基本的なテーマ設定が存在すること', () => {
    const theme = getTheme();
    
    // 必須のテーマプロパティが存在することを確認
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.colors.primary).toBeDefined();
    expect(theme.colors.background).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.typography.fontFamily).toBeDefined();
  });

  it('プライマリカラーが有効なカラーコードであること', () => {
    const theme = getTheme();
    expect(theme.colors.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('フォントファミリーが文字列として定義されていること', () => {
    const theme = getTheme();
    expect(typeof theme.typography.fontFamily).toBe('string');
    expect(theme.typography.fontFamily.length).toBeGreaterThan(0);
  });

  it('チャットウィジェット用のスタイル設定が存在すること', () => {
    const theme = getTheme();
    expect(theme.chatWidget).toBeDefined();
    expect(theme.chatWidget.buttonSize).toBeDefined();
    expect(theme.chatWidget.borderRadius).toBeDefined();
  });
}); 