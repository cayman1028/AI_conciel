import { describe, expect, it } from '@jest/globals';
import { getResponse } from '../../services/responseService';

describe('定型回答サービス', () => {
  it('質問に対して適切な定型回答を返すこと', () => {
    // 基本的な質問と回答のテスト
    expect(getResponse('こんにちは')).toBe('こんにちは！どのようなご用件でしょうか？');
    expect(getResponse('営業時間を教えてください')).toBe('営業時間は平日9時から18時までです。');
  });

  it('類似の質問に対して同じ回答を返すこと', () => {
    // 表現の揺れに対応できるかテスト
    const response1 = getResponse('営業時間は？');
    const response2 = getResponse('営業時間を教えてください');
    const response3 = getResponse('何時まで営業していますか');
    
    expect(response1).toBe(response2);
    expect(response2).toBe(response3);
  });

  it('未定義の質問に対してはデフォルトの回答を返すこと', () => {
    // 定義されていない質問への対応
    expect(getResponse('予想外の質問です')).toBe('申し訳ありませんが、その質問にはお答えできません。別のご質問はありますか？');
  });

  it('前後の空白を無視して回答を返すこと', () => {
    // 入力の正規化テスト
    expect(getResponse('  こんにちは  ')).toBe('こんにちは！どのようなご用件でしょうか？');
  });
}); 