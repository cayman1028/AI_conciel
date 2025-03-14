import { getCompanyConfig } from '@/lib/companyConfig';
import { NextRequest, NextResponse } from 'next/server';
// OpenAIの直接インポートを削除
// import OpenAI from 'openai';
// 代わりにOpenAIServiceを使用
import { getOpenAIService, OpenAIService } from '@/lib/services/openaiService';

// クラスベースの実装に変更
export class ChatApiHandler {
  // レート制限のための変数
  private ipRateLimits = new Map<string, { count: number, resetTime: number }>();

  // メモリキャッシュ（高速化のため）
  private promptCache = new Map<string, string>();
  private responseCache = new Map<string, { response: any, timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分間キャッシュを保持

  // サービス依存関係
  private openaiService: OpenAIService;

  // プリコンパイルされたプロンプト（初期化時に一度だけ処理）
  private readonly TOPIC_EXTRACTION_PROMPT = `
あなたはユーザーとの会話からトピックを抽出するAIです。
以下の会話から主要なトピックを3-5個抽出し、単語または短いフレーズでリストアップしてください。
トピックは日本語で、カンマ区切りの配列形式で出力してください。
例: ["旅行", "食事", "趣味"]

会話:
`;

  // あいまい表現検出のためのプロンプト
  private readonly AMBIGUOUS_EXPRESSION_PROMPT = `
あなたは日本語の婉曲表現やあいまい表現を検出し解釈するAIです。
以下のユーザーの発言から、日本語特有のあいまい表現、婉曲表現、遠回しな表現を検出し、その真意を解釈してください。
会話の文脈や前後の発言、トピックを考慮して解釈してください。

検出すべき表現の例:
- 「ちょっと」「少し」（控えめな表現で実際は「とても」の意味かもしれない）
- 「もしよかったら」「できれば」（実際には強い要望かもしれない）
- 「～かもしれません」「～と思います」（確信があるが控えめに表現している）
- 「検討します」「難しいかもしれません」（断りの婉曲表現）
- 「そうですね」（同意ではなく考え中や曖昧な返事）
- 「すみません」（謝罪ではなく感謝や注意喚起の意味）
- 「よろしければ」「お手すきの際に」（実際には早急な対応を期待している）
- 「気にしないでください」（実際には気にしている）
- 「大丈夫です」（実際には問題がある可能性）

文脈に応じた解釈の例:
- ビジネス文脈での「検討します」は多くの場合「実現は難しい」という意味
- 顧客からの「ちょっと高いですね」は「値下げしてほしい」という要望かもしれない
- 上司への「可能であれば」は「強く希望する」という意味かもしれない

JSON形式で以下の情報を返してください:
{
  "detected": true/false,  // あいまい表現が検出されたかどうか
  "expression": "検出された表現",  // 検出された表現（なければ空文字）
  "interpretation": "解釈された真意",  // 表現の解釈（なければ空文字）
  "confidence": 0-1,  // 解釈の確信度（0.0〜1.0）
  "context_factors": ["考慮した文脈要素1", "考慮した文脈要素2"]  // 解釈に影響を与えた文脈要素
}

会話の文脈:
{{CONVERSATION_CONTEXT}}

ユーザーの発言:
`;

  // 初期レスポンス用のプロンプト（高速応答のため）
  private readonly INITIAL_RESPONSE_PROMPT = `
あなたはユーザーの質問に対して、まず最初に短い応答を返し、その後詳細な回答を続けるAIアシスタントです。
最初の応答は1-2文の短い文で、ユーザーの質問に対する直接的な答えや、これから詳しく説明することを伝える内容にしてください。
例えば「はい、それは可能です。詳細を説明します。」「ご質問ありがとうございます。その点について解説します。」などです。
`;

  // あいまい表現を含む可能性が高い表現のパターン（高速フィルタリング用）
  private readonly AMBIGUOUS_PATTERNS = [
    'ちょっと', '少し', 'もしよかったら', 'できれば', 'かもしれません', 'と思います',
    '検討', '難しい', 'そうですね', 'すみません', 'よろしければ', 'お手すき',
    '気にしないで', '大丈夫です', 'いいんじゃないですか', 'どうでしょうか'
  ];

  constructor(openaiService?: OpenAIService) {
    this.openaiService = openaiService || getOpenAIService();
  }

  // ストリーミングレスポンスのエンコーダー
  private encoder = new TextEncoder();
  private createEncoder() {
    return (chunk: string) => this.encoder.encode(chunk);
  }

  // ストリーミングレスポンスを作成する関数
  private createStreamResponse(stream: ReadableStream) {
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    });
  }

  // メッセージのハッシュ値を計算する関数（キャッシュキーとして使用）
  private computeMessageHash(messages: any[]): string {
    // 単純化のため、JSON文字列化してハッシュ代わりに使用
    return JSON.stringify(messages.map(m => ({
      role: m.role,
      content: m.content
    })));
  }

  // レート制限をチェックする関数
  private checkRateLimit(ip: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const limit = this.ipRateLimits.get(ip);

    if (!limit) {
      // 初回リクエスト
      this.ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (now > limit.resetTime) {
      // 制限時間をリセット
      this.ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limit.count < maxRequests) {
      // リクエスト数をインクリメント
      limit.count++;
      return true;
    }

    // レート制限超過
    return false;
  }

  // メインのリクエスト処理関数
  public async handleRequest(req: NextRequest): Promise<Response> {
    try {
      // IPアドレスの取得
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      
      // リクエストボディの解析
      const body = await req.json().catch(() => ({}));
      
      // 必須フィールドのチェック
      if (!body.messages || !Array.isArray(body.messages)) {
        return NextResponse.json(
          { error: '無効なリクエスト形式です。messagesフィールドが必要です。' },
          { status: 400 }
        );
      }
      
      // 会社IDの取得（リクエストから、またはデフォルト）
      const companyId = body.companyId || 'default';
      
      // 会社設定の取得
      const config = await getCompanyConfig(companyId);
      
      // レート制限のチェック
      if (!this.checkRateLimit(ip, config.rateLimit.maxRequests, config.rateLimit.windowMs)) {
        return NextResponse.json(
          { error: 'リクエストが多すぎます。しばらく待ってから再試行してください。' },
          { status: 429 }
        );
      }

      // 以下は既存の処理を継続...
      // 実際の実装では、OpenAIServiceを使用するように変更する
      
      // 一時的な実装（リンターエラー回避のため）
      return NextResponse.json(
        { message: { role: 'assistant', content: '実装中の機能です。' } },
        { status: 200 }
      );
    } catch (error) {
      console.error('Chat API error:', error);
      return NextResponse.json(
        { error: 'サーバーエラーが発生しました。' },
        { status: 500 }
      );
    }
  }
}

// シングルトンインスタンス
let chatApiHandler: ChatApiHandler | null = null;

// APIハンドラーの取得（シングルトンパターン）
export function getChatApiHandler(openaiService?: OpenAIService): ChatApiHandler {
  if (!chatApiHandler) {
    chatApiHandler = new ChatApiHandler(openaiService);
  }
  return chatApiHandler;
}

// テスト用にハンドラーをリセット
export function resetChatApiHandler(): void {
  chatApiHandler = null;
}

// Next.js APIルートハンドラー
export async function POST(req: NextRequest): Promise<Response> {
  return getChatApiHandler().handleRequest(req);
} 