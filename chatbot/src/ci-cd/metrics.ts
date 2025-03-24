import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

/**
 * デプロイメトリクスを収集する機能
 */
export interface DeployMetrics {
  deployTime: string;
  buildDuration: number; // ミリ秒
  testDuration: number; // ミリ秒
  deployDuration: number; // ミリ秒
  totalDuration: number; // ミリ秒
  environment: string;
  buildSize: number; // バイト
  jsFileCount: number;
  success: boolean;
  errors?: string[];
}

/**
 * ビルドサイズを計算する
 * @param distDir ビルドディレクトリ
 * @returns 合計サイズ（バイト）
 */
export function calculateBuildSize(distDir: string): number {
  let totalSize = 0;
  
  function traverseDir(dirPath: string) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        traverseDir(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  }
  
  try {
    traverseDir(distDir);
  } catch (error) {
    console.error('ビルドサイズ計算エラー:', error);
  }
  
  return totalSize;
}

/**
 * JavaScriptファイルの数を数える
 * @param distDir ビルドディレクトリ
 * @returns JSファイル数
 */
export function countJsFiles(distDir: string): number {
  let jsCount = 0;
  
  function traverseDir(dirPath: string) {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        traverseDir(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
        jsCount++;
      }
    });
  }
  
  try {
    traverseDir(distDir);
  } catch (error) {
    console.error('JSファイル数計算エラー:', error);
  }
  
  return jsCount;
}

/**
 * デプロイメトリクスを記録する
 * @param metrics メトリクスデータ
 */
export function recordDeployMetrics(metrics: DeployMetrics): void {
  const logDir = path.join(process.cwd(), 'logs');
  
  // ログディレクトリが存在しない場合は作成
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // メトリクスファイル名（日時を含む）
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const metricsFileName = `deploy-metrics-${metrics.environment}-${timestamp}.json`;
  const metricsFilePath = path.join(logDir, metricsFileName);
  
  // メトリクスをJSONとして保存
  fs.writeFileSync(metricsFilePath, JSON.stringify(metrics, null, 2));
  
  console.log(`デプロイメトリクスを記録しました: ${metricsFilePath}`);
  
  // 最新のメトリクスとして別名でも保存
  const latestMetricsPath = path.join(logDir, `latest-${metrics.environment}-metrics.json`);
  fs.writeFileSync(latestMetricsPath, JSON.stringify(metrics, null, 2));
}

/**
 * デプロイプロセスの時間計測を開始する
 * @returns 開始時間のタイムスタンプ
 */
export function startDeployTimer(): number {
  return performance.now();
}

/**
 * デプロイプロセスの時間計測を終了し、経過時間を返す
 * @param startTime 開始時間
 * @returns 経過時間（ミリ秒）
 */
export function endDeployTimer(startTime: number): number {
  return performance.now() - startTime;
} 