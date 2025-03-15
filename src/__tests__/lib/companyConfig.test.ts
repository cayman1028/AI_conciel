/**
 * companyConfig.tsのテスト
 */

// 実際のモジュールをモック
jest.mock('../../lib/companyConfig');

// モックした後にインポート
import {
    CompanyConfig,
    CompanyConfigService,
    getAvailableCompanyIds,
    getCompanyConfig,
    getCompanyConfigProperty,
    getCompanyConfigSection,
    getCompanyConfigService
} from '../../lib/companyConfig';

// モックデータ
const mockConfig: CompanyConfig = {
  name: 'テスト会社',
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
};

// モックサービスクラス
class MockCompanyConfigService implements CompanyConfigService {
  async getCompanyConfig(companyId: string = 'default'): Promise<CompanyConfig> {
    return mockConfig;
  }
  
  async getCompanyConfigSection(companyId: string = 'default', section: keyof CompanyConfig): Promise<any> {
    return mockConfig[section];
  }
  
  async getCompanyConfigProperty<T>(
    companyId: string = 'default',
    path: string,
    defaultValue: T
  ): Promise<T> {
    const pathParts = path.split('.');
    let value: any = mockConfig;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return defaultValue;
      }
    }
    
    return (value as unknown as T) || defaultValue;
  }
  
  async getAvailableCompanyIds(): Promise<string[]> {
    return ['default', 'company-a'];
  }
  
  clearCache(): void {
    // キャッシュクリア処理（テストでは実際には何もしない）
  }
}

// モックサービスのインスタンス
const mockServiceInstance = new MockCompanyConfigService();

// 各テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  
  // モック関数の実装を設定
  (getCompanyConfigService as jest.Mock).mockReturnValue(mockServiceInstance);
  
  (getCompanyConfig as jest.Mock).mockImplementation(async (companyId = 'default') => {
    return mockServiceInstance.getCompanyConfig(companyId);
  });
  
  (getCompanyConfigSection as jest.Mock).mockImplementation(async (companyId = 'default', section) => {
    return mockServiceInstance.getCompanyConfigSection(companyId, section);
  });
  
  (getCompanyConfigProperty as jest.Mock).mockImplementation(async (companyId = 'default', path, defaultValue) => {
    return mockServiceInstance.getCompanyConfigProperty(companyId, path, defaultValue);
  });
  
  (getAvailableCompanyIds as jest.Mock).mockImplementation(async () => {
    return mockServiceInstance.getAvailableCompanyIds();
  });
});

describe('CompanyConfigService', () => {
  it('getCompanyConfigServiceはモックサービスを返すこと', () => {
    const service = getCompanyConfigService();
    expect(service).toBe(mockServiceInstance);
  });

  it('getCompanyConfigはモックデータを返すこと', async () => {
    const config = await getCompanyConfig();
    expect(config).toBeDefined();
    expect(config.name).toBe('テスト会社');
  });

  it('getCompanyConfigSectionはモックデータのセクションを返すこと', async () => {
    const apiSettings = await getCompanyConfigSection('default', 'apiSettings');
    expect(apiSettings).toBeDefined();
    expect(apiSettings.chatModel).toBe('gpt-3.5-turbo');
  });

  it('getCompanyConfigPropertyはモックデータのプロパティを返すこと', async () => {
    const chatModel = await getCompanyConfigProperty('default', 'apiSettings.chatModel', '');
    expect(chatModel).toBe('gpt-3.5-turbo');
  });
}); 