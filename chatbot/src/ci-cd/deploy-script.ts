#!/usr/bin/env node

import { deployProcess } from './deploy';

async function main() {
  try {
    // コマンドライン引数から環境を取得（デフォルトはdevelopment）
    const args = process.argv.slice(2);
    const env = args[0] || 'development';
    const continueOnTestFailure = args.includes('--force') || args.includes('-f');
    
    if (env !== 'development' && env !== 'production') {
      console.error('環境は development または production を指定してください');
      process.exit(1);
    }
    
    console.log(`${env}環境へのデプロイを開始します...`);
    if (continueOnTestFailure) {
      console.log('--forceフラグが指定されているため、テストが失敗しても続行します');
    }
    
    // デプロイプロセスを実行
    await deployProcess(env, continueOnTestFailure);
    
    console.log('デプロイが正常に完了しました');
    process.exit(0);
  } catch (error) {
    console.error('デプロイに失敗しました:', error);
    process.exit(1);
  }
}

main(); 