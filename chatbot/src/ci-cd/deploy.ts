import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
    calculateBuildSize,
    countJsFiles,
    DeployMetrics,
    endDeployTimer,
    recordDeployMetrics,
    startDeployTimer
} from './metrics';

/**
 * package.jsonの設定を検証し、必要な情報を取得する
 * @param projectRoot プロジェクトのルートディレクトリ
 * @returns パッケージ設定オブジェクト
 */
export function validatePackageConfig(projectRoot: string): any {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.jsonが見つかりません');
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  // 必須項目の検証
  if (!packageJson.name) {
    throw new Error('package.jsonにname項目がありません');
  }
  
  if (!packageJson.scripts || !packageJson.scripts.build) {
    throw new Error('package.jsonにbuildスクリプトがありません');
  }
  
  if (!packageJson.scripts.test) {
    throw new Error('package.jsonにtestスクリプトがありません');
  }
  
  return packageJson;
}

/**
 * ビルドコマンドを取得する
 * @returns ビルドコマンド
 */
export function getBuildCommand(): string {
  return 'npm run build';
}

/**
 * テストコマンドを取得する
 * @returns テストコマンド
 */
export function getTestCommand(): string {
  return 'npm test -- --watchAll=false';
}

/**
 * デプロイ環境に応じたコマンドを取得する
 * @param env デプロイ環境（development/production）
 * @returns デプロイコマンド
 */
export function getDeployCommand(env: string): string {
  switch(env) {
    case 'development':
      return 'npx http-server dist -p 8080 --cors -o';
    case 'production-vercel':
      return 'npx vercel --prod';
    case 'production-render':
      return 'npx render deploy --prod';
    case 'production':
      // fallback to Vercel
      return 'npx vercel --prod';
    default:
      throw new Error(`未知のデプロイ環境です: ${env}`);
  }
}

/**
 * ビルドとテストを実行し、結果に問題がなければデプロイする
 * @param env デプロイ環境
 * @param continueOnTestFailure テストが失敗しても続行するかどうか
 */
export async function deployProcess(env: string = 'development', continueOnTestFailure: boolean = false): Promise<void> {
  // 総合タイマー開始
  const totalStartTime = startDeployTimer();
  const errors: string[] = [];
  const metrics: Partial<DeployMetrics> = {
    deployTime: new Date().toISOString(),
    environment: env,
    success: false
  };

  try {
    console.log('デプロイプロセスを開始します...');
    
    // package.jsonの検証
    validatePackageConfig(process.cwd());
    
    // 環境変数の確認
    if (env === 'production' && !process.env.DEPLOY_KEY) {
      throw new Error('本番環境デプロイには環境変数DEPLOY_KEYが必要です');
    }
    
    console.log('設定の検証が完了しました');
    console.log(`環境: ${env}`);
    
    // テスト実行
    console.log('テストを実行します...');
    const testStartTime = startDeployTimer();
    try {
      execSync(getTestCommand(), { stdio: 'inherit' });
      console.log('テストが成功しました');
    } catch (error) {
      if (!continueOnTestFailure) {
        throw new Error('テストに失敗しました');
      }
      console.warn('テストに失敗しましたが、continueOnTestFailureフラグが有効なため続行します');
      errors.push('テスト失敗');
    }
    metrics.testDuration = endDeployTimer(testStartTime);
    
    // ビルド実行
    console.log('ビルドを実行します...');
    const buildStartTime = startDeployTimer();
    try {
      execSync(getBuildCommand(), { stdio: 'inherit' });
      console.log('ビルドが成功しました');
      
      // ビルドサイズとJSファイル数を計算
      const distPath = path.join(process.cwd(), 'dist');
      metrics.buildSize = calculateBuildSize(distPath);
      metrics.jsFileCount = countJsFiles(distPath);
      
    } catch (error) {
      throw new Error('ビルドに失敗しました');
    }
    metrics.buildDuration = endDeployTimer(buildStartTime);
    
    // デプロイ実行
    console.log('デプロイを実行します...');
    const deployStartTime = startDeployTimer();
    try {
      execSync(getDeployCommand(env), { stdio: 'inherit' });
      console.log('デプロイが完了しました');
    } catch (error) {
      throw new Error('デプロイに失敗しました');
    }
    metrics.deployDuration = endDeployTimer(deployStartTime);
    
    // 成功フラグを設定
    metrics.success = true;
  } catch (error) {
    console.error('デプロイに失敗しました:', error);
    errors.push(error instanceof Error ? error.message : String(error));
    metrics.success = false;
    throw error;
  } finally {
    // 総合タイマー終了と記録
    metrics.totalDuration = endDeployTimer(totalStartTime);
    metrics.errors = errors.length > 0 ? errors : undefined;
    
    // メトリクスを記録
    try {
      recordDeployMetrics(metrics as DeployMetrics);
    } catch (e) {
      console.error('メトリクス記録中にエラーが発生しました:', e);
    }
  }
} 