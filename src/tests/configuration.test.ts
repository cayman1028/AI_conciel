import { describe, expect, it } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('プロジェクト設定', () => {
  it('package.jsonにts-nodeが含まれていること', () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    expect(packageJson.devDependencies['ts-node']).toBeDefined();
  });
  
  it('jest.config.tsが正しく設定されていること', () => {
    const configPath = path.resolve(__dirname, '../../jest.config.ts');
    expect(fs.existsSync(configPath)).toBe(true);
    
    // ファイルの内容を文字列として読み込み、必要な設定が含まれているか確認
    const configContent = fs.readFileSync(configPath, 'utf-8');
    expect(configContent).toContain('preset: \'ts-jest\'');
    expect(configContent).toContain('testEnvironment: \'jsdom\'');
    expect(configContent).toContain('setupFilesAfterEnv: [\'./jest.setup.ts\']');
  });
}); 