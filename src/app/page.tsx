'use client';

import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">AIコンシェル</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">AIチャットボット</h2>
          <p className="text-gray-600 mb-4">
            このチャットボットは、あなたの質問に答えるためのAIアシスタントです。
            右下のサポートボタンをクリックして、チャットを開始してください。
          </p>
        </div>
      </div>
      
      <ChatWidget />
    </main>
  );
} 