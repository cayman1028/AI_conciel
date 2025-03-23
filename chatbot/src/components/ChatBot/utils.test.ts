import { chatbotConfig } from '../../config/chatbotConfig';
import { ResponsePattern } from './types';
import { findBestResponse } from './utils';

describe('ChatBot Utils', () => {
  describe('findBestResponse', () => {
    const testResponses: ResponsePattern[] = [
      {
        keywords: ['こんにちは', '挨拶', 'こんばんは'],
        response: '挨拶の応答です'
      },
      {
        keywords: ['営業時間', '開店', '閉店'],
        response: '営業時間の応答です'
      },
      {
        keywords: ['場所', '住所', 'どこ'],
        response: '場所の応答です'
      }
    ];
    
    const defaultTestResponse = 'デフォルトの応答です';

    it('キーワードが完全一致する場合、適切な応答を返す', () => {
      const userInput = 'こんにちは、お元気ですか？';
      const result = findBestResponse(userInput, testResponses, defaultTestResponse);
      expect(result).toBe('挨拶の応答です');
    });

    it('キーワードが部分一致する場合、適切な応答を返す', () => {
      const userInput = 'お店の営業時間について教えてください';
      const result = findBestResponse(userInput, testResponses, defaultTestResponse);
      expect(result).toBe('営業時間の応答です');
    });

    it('複数のキーワードカテゴリにマッチする場合、最初にマッチしたものを返す', () => {
      const userInput = 'こんにちは、営業時間を教えてください';
      const result = findBestResponse(userInput, testResponses, defaultTestResponse);
      expect(result).toBe('挨拶の応答です');
    });

    it('どのキーワードにもマッチしない場合、デフォルトの応答を返す', () => {
      const userInput = '全く関係のない質問です';
      const result = findBestResponse(userInput, testResponses, defaultTestResponse);
      expect(result).toBe('デフォルトの応答です');
    });

    it('空の入力の場合、デフォルトの応答を返す', () => {
      const userInput = '';
      const result = findBestResponse(userInput, testResponses, defaultTestResponse);
      expect(result).toBe('デフォルトの応答です');
    });
    
    it('設定ファイルの応答データでも正しく動作する', () => {
      const userInput = '営業時間を教えてください';
      const result = findBestResponse(userInput, chatbotConfig.responses, chatbotConfig.defaultResponse);
      expect(result).toContain('営業時間');
    });
  });
}); 