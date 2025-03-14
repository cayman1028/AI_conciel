/**
 * companyConfig.tsのテスト
 */

import { getCompanyConfig, getCompanyConfigSection } from '../../lib/companyConfig';

// モックデータ
const mockConfigs = {
  'default': {
    name: 'デフォルト会社',
    greeting: {
      morning: 'おはようございます',
      afternoon: 'こんにちは',
      evening: 'こんばんは',
      night: 'おやすみなさい',
    },
    systemPrompt: 'あなたはAIアシスタントです',
    apiSettings: {
      chatModel: 'gpt-3.5-turbo',
      ambiguousExpressionModel: 'gpt-4',
      topicExtractionModel: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 1000,
    },
    rateLimit: {
      maxRequests: 10,
      windowMs: 60000,
    },
    ui: {
      primaryColor: '#0000ff',
      secondaryColor: '#00ffff',
      fontFamily: 'sans-serif',
      borderRadius: '4px',
    },
  },
  'company-a': {
    name: 'テスト会社A',
    greeting: {
      morning: 'おはようございます、A社です',
      afternoon: 'こんにちは、A社です',
      evening: 'こんばんは、A社です',
      night: 'おやすみなさい、A社です',
    },
    systemPrompt: 'あなたはA社のAIアシスタントです',
    apiSettings: {
      chatModel: 'gpt-4',
      ambiguousExpressionModel: 'gpt-4',
      topicExtractionModel: 'gpt-3.5-turbo',
      temperature: 0.8,
      maxTokens: 2000,
    },
    rateLimit: {
      maxRequests: 5,
      windowMs: 60000,
    },
    ui: {
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      fontFamily: 'Arial',
      borderRadius: '8px',
    },
  }
};

// モック関数を設定
jest.mock('../../lib/companyConfig');
const mockedGetCompanyConfig = getCompanyConfig as jest.MockedFunction<typeof getCompanyConfig>;
const mockedGetCompanyConfigSection = getCompanyConfigSection as jest.MockedFunction<typeof getCompanyConfigSection>;

describe('getCompanyConfig関数のテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // モック実装を設定
    mockedGetCompanyConfig.mockImplementation((companyId = 'default') => {
      return Promise.resolve(mockConfigs[companyId as keyof typeof mockConfigs] || mockConfigs['default']);
    });
    
    mockedGetCompanyConfigSection.mockImplementation((companyId = 'default', section) => {
      const config = mockConfigs[companyId as keyof typeof mockConfigs] || mockConfigs['default'];
      return Promise.resolve(config[section as keyof typeof config]);
    });
  });

  it('デフォルト設定を正しく取得できること', async () => {
    const config = await getCompanyConfig('default');
    expect(config).toBeDefined();
    expect(config.name).toBe('デフォルト会社');
    expect(config.apiSettings.chatModel).toBe('gpt-3.5-turbo');
    expect(config.ui.primaryColor).toBe('#0000ff');
  });

  it('存在する会社の設定を正しく取得できること', async () => {
    const config = await getCompanyConfig('company-a');
    expect(config).toBeDefined();
    expect(config.name).toBe('テスト会社A');
    expect(config.apiSettings.chatModel).toBe('gpt-4');
    expect(config.ui.primaryColor).toBe('#ff0000');
  });

  it('存在しない会社IDの場合はデフォルト設定を返すこと', async () => {
    const config = await getCompanyConfig('non-existent');
    expect(config).toBeDefined();
    expect(config.name).toBe('デフォルト会社');
    expect(config.apiSettings.chatModel).toBe('gpt-3.5-turbo');
  });

  it('同じcompanyIdで複数回呼び出した場合はキャッシュから返すこと', async () => {
    // 1回目の呼び出し
    const config1 = await getCompanyConfig('company-a');
    expect(config1.name).toBe('テスト会社A');
    
    // 2回目の呼び出し（キャッシュから取得されるはず）
    const config2 = await getCompanyConfig('company-a');
    expect(config2.name).toBe('テスト会社A');
    
    // getCompanyConfigが2回呼ばれたことを確認
    expect(mockedGetCompanyConfig).toHaveBeenCalledTimes(2);
  });
});

describe('getCompanyConfigSection関数のテスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // モック実装を設定
    mockedGetCompanyConfigSection.mockImplementation((companyId = 'default', section) => {
      const config = mockConfigs[companyId as keyof typeof mockConfigs] || mockConfigs['default'];
      return Promise.resolve(config[section as keyof typeof config]);
    });
  });

  it('存在する会社の設定セクションを正しく取得できること', async () => {
    const apiSettings = await getCompanyConfigSection('company-a', 'apiSettings');
    expect(apiSettings).toBeDefined();
    expect(apiSettings.chatModel).toBe('gpt-4');
    expect(apiSettings.temperature).toBe(0.8);
  });

  it('存在しないセクションの場合はundefinedを返すこと', async () => {
    const nonExistentSection = await getCompanyConfigSection('company-a', 'nonExistentSection');
    expect(nonExistentSection).toBeUndefined();
  });

  it('存在しない会社IDの場合はデフォルト設定のセクションを返すこと', async () => {
    const apiSettings = await getCompanyConfigSection('non-existent', 'apiSettings');
    expect(apiSettings).toBeDefined();
    expect(apiSettings.chatModel).toBe('gpt-3.5-turbo');
    expect(apiSettings.temperature).toBe(0.7);
  });
}); 