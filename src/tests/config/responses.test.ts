import { describe, expect, it } from '@jest/globals';
import { getResponses } from '../../config/responses';

describe('レスポンス設定', () => {
  const responses = getResponses();

  it('基本的なレスポンス設定が定義されていること', () => {
    expect(responses).toBeDefined();
    expect(responses.greeting).toBeDefined();
    expect(responses.error).toBeDefined();
    expect(responses.chatbot).toBeDefined();
  });

  it('質問カテゴリーが定義されていること', () => {
    expect(responses.questions).toBeDefined();
    expect(responses.questions.categories).toBeDefined();
    expect(Array.isArray(responses.questions.categories)).toBe(true);
  });

  it('各カテゴリーに必要な情報が含まれていること', () => {
    responses.questions.categories.forEach(category => {
      expect(category.id).toBeDefined();
      expect(category.title).toBeDefined();
      expect(category.questions).toBeDefined();
      expect(Array.isArray(category.questions)).toBe(true);
    });
  });

  it('各質問に必要な情報が含まれていること', () => {
    responses.questions.categories.forEach(category => {
      category.questions.forEach(question => {
        expect(question.id).toBeDefined();
        expect(question.text).toBeDefined();
        expect(question.answer).toBeDefined();
      });
    });
  });

  it('質問の回答が文字列であること', () => {
    responses.questions.categories.forEach(category => {
      category.questions.forEach(question => {
        expect(typeof question.answer).toBe('string');
      });
    });
  });
}); 