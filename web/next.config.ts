import type { NextConfig } from "next";

/** すべての応答に付けるセキュリティヘッダー（CSP は nonce が必要なため src/proxy.ts で付ける） */
const securityHeaders = [
  // 2年間、HTTPS のみで接続させる
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 使わない端末機能はすべて無効化
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // フレームワーク名を応答ヘッダーに出さない
  poweredByHeader: false,
  // 画像最適化機能（/_next/image）は使っていないため無効化し、攻撃を受けうる範囲を減らす。
  // 2026年10月に画像最適化の上流ライブラリで重大な脆弱性（CVE-2026-96889）が公表されている。
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // API の応答はキャッシュさせない
      // API はデータのみを返すため、何も読み込ませない
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
