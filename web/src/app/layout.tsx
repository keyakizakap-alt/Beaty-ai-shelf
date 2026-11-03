import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { connection } from "next/server";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const sans = Noto_Sans_JP({
  variable: "--font-sans-jp",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false,
});

const serif = Noto_Serif_JP({
  variable: "--font-serif-jp",
  weight: ["500", "600"],
  display: "swap",
  preload: false,
});

const DESCRIPTION =
  "ChatGPTやGeminiが、あなたの化粧品を薦めているか。美容に特化した質問で記録・比較し、薬機法に配慮した表現チェックまで行えるツールです。";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Beauty AI Shelf — 化粧品ブランドのAI推薦モニター",
    template: "%s | Beauty AI Shelf",
  },
  description: DESCRIPTION,
  applicationName: "Beauty AI Shelf",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "Beauty AI Shelf",
    title: "Beauty AI Shelf — 化粧品ブランドのAI推薦モニター",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary", title: "Beauty AI Shelf", description: DESCRIPTION },
  // 電話番号などの自動リンク化を止め、表示を崩さない
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#171412" },
  ],
};

// CSP の nonce のため全ページをリクエスト時に描画する（静的な先行描画はしない）
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // CSP の nonce をリクエストごとに埋め込むため、すべてのページをリクエスト時に描画する
  await connection();
  return (
    <html lang="ja" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
