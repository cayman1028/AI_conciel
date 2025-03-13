'use client';

import ChatWidget from '@/components/ChatWidget';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-6 sm:p-12 md:p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="mb-4 sm:mb-6 md:mb-8 text-center text-3xl sm:text-3xl md:text-4xl font-bold">AIコンシェル</h1>
        
        <div className="rounded-lg bg-white p-4 sm:p-5 md:p-6 shadow-md mb-6">
          <h2 className="mb-3 sm:mb-4 text-xl sm:text-xl md:text-2xl font-semibold">AIチャットボット</h2>
          <p className="mb-3 sm:mb-4 text-gray-600 text-sm sm:text-base">
            このチャットボットは、あなたの質問に答えるためのAIアシスタントです。
            右下のサポートボタンをクリックして、チャットを開始してください。
          </p>
        </div>
        
        <div className="rounded-lg bg-white p-4 sm:p-5 md:p-6 shadow-md">
          <h2 className="mb-3 sm:mb-4 text-xl sm:text-xl md:text-2xl font-semibold">法人別テスト</h2>
          <p className="mb-3 sm:mb-4 text-gray-600 text-sm sm:text-base">
            各法人向けのチャットボット設定をテストするには、以下のリンクをクリックしてください。
          </p>
          <Link 
            href="/test" 
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            法人別テストページへ
          </Link>
        </div>
      </div>
      
      <ChatWidget />
    </main>
  );
} 