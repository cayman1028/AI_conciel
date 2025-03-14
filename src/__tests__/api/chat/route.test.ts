/**
 * Chat API Routeのテスト
 */

import { getCompanyConfig } from '../../../lib/companyConfig';
import { getResponseTemplate } from '../../../lib/companyResponses';

// モック
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'これはテスト応答です。',
                },
                finish_reason: 'stop',
              },
            ],
          }),
        },
      },
    };
  });
});

jest.mock('../../../lib/companyConfig', () => ({
  getCompanyConfig: jest.fn(),
}));

jest.mock('../../../lib/companyResponses', () => ({
  getResponseTemplate: jest.fn(),
}));

// 環境変数のモック
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.ALLOWED_ORIGINS = '*';

describe('Chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // モックの実装
    (getCompanyConfig as jest.Mock).mockResolvedValue({
      apiSettings: {
        chatModel: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
      },
      rateLimit: {
        maxRequests: 10,
        windowMs: 60000,
      },
    });
    
    (getResponseTemplate as jest.Mock).mockResolvedValue({
      systemPrompt: 'あなたはAIアシスタントです。',
    });
  });

  it('モックが正しく設定されていること', () => {
    expect(getCompanyConfig).toBeDefined();
    expect(getResponseTemplate).toBeDefined();
  });
}); 