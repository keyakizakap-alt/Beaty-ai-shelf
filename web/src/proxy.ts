import { NextResponse, type NextRequest } from "next/server";

/**
 * リクエストごとに nonce を作り、厳格な Content-Security-Policy を付ける。
 * - スクリプトは自サイトのもので、nonce が一致するものだけ実行できる（'unsafe-inline' を使わない）
 * - 外部への通信・読み込みは自サイトのみ（AIへの通信はサーバー側で行うため、ブラウザからは許可しない）
 * - 他サイトの iframe への埋め込みを禁止（クリックジャッキング対策）
 * 参考：Next.js「Content Security Policy」ガイド（同梱ドキュメント）
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Tailwind の style 属性（グラフの幅など）に必要。スタイルはスクリプトより危険性が低い
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|\\.well-known).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
