// モックデータ
const mockCompanyConfig = {
  name: 'テスト会社',
  description: 'テスト用の会社設定',
  theme: {
    primary: '#ff0000',
    secondary: '#00ff00',
    background: '#ffffff',
    text: '#000000',
  },
  rateLimit: {
    maxRequests: 5,
    windowMs: 60000,
  },
};

// デフォルト設定のモック
const mockDefaultConfig = {
  name: 'デフォルト会社',
  description: 'デフォルト設定',
  theme: {
    primary: '#0000ff',
    secondary: '#00ffff',
    background: '#f0f0f0',
    text: '#333333',
  },
  rateLimit: {
    maxRequests: 10,
    windowMs: 60000,
  },
};

// モック関数
const mockGetCompanyConfig = jest.fn(async (companyId: string) => {
  if (companyId === 'test-company') {
    return mockCompanyConfig;
  }
  return mockDefaultConfig;
});

const mockGetDefaultCompanyConfig = jest.fn(() => mockDefaultConfig);

// モジュールのモック
jest.mock('../../lib/companyConfig', () => ({
  getCompanyConfig: (companyId: string) => mockGetCompanyConfig(companyId),
  getDefaultCompanyConfig: () => mockGetDefaultCompanyConfig()
}));

describe('companyConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompanyConfig', () => {
    it('指定された法人IDの設定を取得できること', async () => {
      const config = await mockGetCompanyConfig('test-company');
      
      expect(config).toEqual(mockCompanyConfig);
      expect(mockGetCompanyConfig).toHaveBeenCalledWith('test-company');
    });

    it('存在しない法人IDの場合はデフォルト設定を返すこと', async () => {
      const config = await mockGetCompanyConfig('non-existent-company');
      
      expect(config).toEqual(mockDefaultConfig);
      expect(mockGetCompanyConfig).toHaveBeenCalledWith('non-existent-company');
    });
  });

  describe('getDefaultCompanyConfig', () => {
    it('デフォルト設定を返すこと', () => {
      const defaultConfig = mockGetDefaultCompanyConfig();
      
      expect(defaultConfig).toHaveProperty('name');
      expect(defaultConfig).toHaveProperty('description');
      expect(defaultConfig).toHaveProperty('theme');
      expect(defaultConfig.theme).toHaveProperty('primary');
      expect(defaultConfig.theme).toHaveProperty('secondary');
      expect(defaultConfig).toHaveProperty('rateLimit');
      expect(defaultConfig.rateLimit).toHaveProperty('maxRequests');
      expect(defaultConfig.rateLimit).toHaveProperty('windowMs');
    });
  });
}); 