"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chatbotConfig_1 = require("../../config/chatbotConfig");
const utils_1 = require("./utils");
describe('ChatBot Utils', () => {
    describe('findBestResponse', () => {
        const testResponses = [
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
            const result = (0, utils_1.findBestResponse)(userInput, testResponses, defaultTestResponse);
            expect(result).toBe('挨拶の応答です');
        });
        it('キーワードが部分一致する場合、適切な応答を返す', () => {
            const userInput = 'お店の営業時間について教えてください';
            const result = (0, utils_1.findBestResponse)(userInput, testResponses, defaultTestResponse);
            expect(result).toBe('営業時間の応答です');
        });
        it('複数のキーワードカテゴリにマッチする場合、最初にマッチしたものを返す', () => {
            const userInput = 'こんにちは、営業時間を教えてください';
            const result = (0, utils_1.findBestResponse)(userInput, testResponses, defaultTestResponse);
            expect(result).toBe('挨拶の応答です');
        });
        it('どのキーワードにもマッチしない場合、デフォルトの応答を返す', () => {
            const userInput = '全く関係のない質問です';
            const result = (0, utils_1.findBestResponse)(userInput, testResponses, defaultTestResponse);
            expect(result).toBe('デフォルトの応答です');
        });
        it('空の入力の場合、デフォルトの応答を返す', () => {
            const userInput = '';
            const result = (0, utils_1.findBestResponse)(userInput, testResponses, defaultTestResponse);
            expect(result).toBe('デフォルトの応答です');
        });
        it('設定ファイルの応答データでも正しく動作する', () => {
            const userInput = '営業時間を教えてください';
            const result = (0, utils_1.findBestResponse)(userInput, chatbotConfig_1.chatbotConfig.responses, chatbotConfig_1.chatbotConfig.defaultResponse);
            expect(result).toContain('営業時間');
        });
    });
});
