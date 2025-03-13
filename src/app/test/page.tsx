'use client';

import ChatWidget from '@/components/ChatWidget';
import Link from 'next/link';
import { useState } from 'react';

export default function TestPage() {
  const [selectedCompany, setSelectedCompany] = useState<string>('default');
  
  const companies = [
    { id: 'default', name: 'デフォルト設定' },
    { id: 'company-a', name: '法人A（製品メーカー）' },
    { id: 'company-b', name: '法人B（ITサービス）' },
    { id: 'company-c', name: '法人C（健康・医療）' }
  ];

  return (
    <main className="flex min-h-screen flex-col items-center p-6 sm:p-12">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">法人別テスト</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            ホームに戻る
          </Link>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">法人を選択</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompany(company.id)}
                className={`p-4 rounded-lg border ${
                  selectedCompany === company.id
                    ? 'bg-blue-100 border-blue-500'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {company.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            現在のテスト: {companies.find(c => c.id === selectedCompany)?.name}
          </h2>
          <p className="mb-4 text-gray-600">
            以下のチャットウィジェットは選択した法人の設定に基づいて表示されます。
            テーマカラー、応答スタイル、機能などの違いを確認できます。
          </p>
        </div>
      </div>
      
      <div className="mt-8 w-full flex justify-center">
        <ChatWidget companyId={selectedCompany} />
      </div>
    </main>
  );
} 