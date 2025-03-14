const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // next.config.jsとテスト環境用の.envファイルが配置されたディレクトリのパス
  dir: './',
});

// Jestに渡すカスタム設定
const customJestConfig = {
  // テストファイルのパターンを指定
  testMatch: ['**/__tests__/**/*.test.(ts|tsx|js|jsx)'],
  // テスト環境を指定
  testEnvironment: 'jest-environment-jsdom',
  // セットアップファイルを指定
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // モジュール名のマッピングを指定
  moduleNameMapper: {
    // CSSモジュールのモック
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // パスエイリアスの設定
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // カバレッジの設定
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  // カバレッジのしきい値
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // トランスフォームの設定
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  // テストのタイムアウト時間を60秒に設定
  testTimeout: 60000,
  // 各テストファイル実行後にテスト環境をリセット
  restoreMocks: true,
  clearMocks: true,
  resetMocks: true,
};

// createJestConfigを使用して、Next.jsの設定を反映したJest設定を作成
module.exports = createJestConfig(customJestConfig); 