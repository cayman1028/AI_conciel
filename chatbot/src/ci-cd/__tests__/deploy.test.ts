import fs from 'fs';
import path from 'path';
import { getBuildCommand, getDeployCommand, getTestCommand, validatePackageConfig } from '../deploy';

describe('デプロイメント設定テスト', () => {
  const projectRoot = path.resolve(__dirname, '../../../');
  
  test('package.jsonに必要なスクリプトが設定されていること', () => {
    // パッケージ設定の検証
    const packageJsonPath = path.join(projectRoot, 'package.json');
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    // 必要なnpmスクリプトが存在するか確認
    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts.test).toBeDefined();
    expect(packageJson.scripts.lint).toBeDefined();
  });
  
  test('デプロイ設定が正しく読み込まれること', () => {
    // デプロイ設定の読み込みをテスト
    const config = validatePackageConfig(projectRoot);
    
    expect(config).toBeDefined();
    expect(config.name).toBe('chatbot');
    expect(config.scripts).toBeDefined();
    expect(config.scripts.build).toBeDefined();
  });
  
  test('ビルドコマンドが取得できること', () => {
    // ビルドコマンドの取得をテスト
    const buildCmd = getBuildCommand();
    
    expect(buildCmd).toBe('npm run build');
  });
  
  test('テストコマンドが取得できること', () => {
    // テストコマンドの取得をテスト
    const testCmd = getTestCommand();
    
    expect(testCmd).toBe('npm test -- --watchAll=false');
  });
  
  test('デプロイコマンドが環境に応じて取得できること', () => {
    // 開発環境用デプロイコマンド
    const devDeployCmd = getDeployCommand('development');
    expect(devDeployCmd).toContain('development');
    
    // 本番環境用デプロイコマンド
    const prodDeployCmd = getDeployCommand('production');
    expect(prodDeployCmd).toContain('production');
  });
});

describe('CI/CDパイプラインテスト', () => {
  test('CIワークフローファイルが存在すること', () => {
    // .github/workflowsディレクトリが存在しない場合はスキップ
    const workflowsPath = path.resolve(__dirname, '../../../../.github/workflows');
    if (!fs.existsSync(workflowsPath)) {
      console.log('GitHub Actionsのワークフローディレクトリが存在しないためスキップします');
      return;
    }
    
    // CI設定ファイルが存在するか確認
    const ciConfigPath = path.join(workflowsPath, 'ci.yml');
    expect(fs.existsSync(ciConfigPath)).toBe(true);
    
    // CI設定ファイルの内容を確認
    const ciConfig = fs.readFileSync(ciConfigPath, 'utf-8');
    expect(ciConfig).toContain('name: CI');
    expect(ciConfig).toContain('npm test');
    expect(ciConfig).toContain('npm run build');
  });
  
  test('CDワークフローファイルが存在すること', () => {
    // .github/workflowsディレクトリが存在しない場合はスキップ
    const workflowsPath = path.resolve(__dirname, '../../../../.github/workflows');
    if (!fs.existsSync(workflowsPath)) {
      console.log('GitHub Actionsのワークフローディレクトリが存在しないためスキップします');
      return;
    }
    
    // CD設定ファイルが存在するか確認
    const cdConfigPath = path.join(workflowsPath, 'cd.yml');
    expect(fs.existsSync(cdConfigPath)).toBe(true);
    
    // CD設定ファイルの内容を確認
    const cdConfig = fs.readFileSync(cdConfigPath, 'utf-8');
    expect(cdConfig).toContain('name: CD');
    expect(cdConfig).toContain('deploy');
  });
}); 