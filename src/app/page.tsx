'use client';

import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  return (
    <>
      <header>
        <div className="header-container">
          <div className="logo">AIコンシェル</div>
          <nav>
            <ul>
              <li>ホーム</li>
              <li>サービス</li>
              <li>料金</li>
              <li>お問い合わせ</li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <h1>AIを活用したカスタマーサポートチャットボット</h1>
          <p>AIコンシェルは、最新のAI技術を活用したチャットボットサービスです。お客様のサポート業務を効率化し、24時間365日の対応を可能にします。</p>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 AIコンシェル. All rights reserved.</p>
      </footer>
      
      <ChatWidget />
    </>
  );
} 