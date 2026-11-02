import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Beauty AI Shelf — 化粧品ブランドのAI推薦モニター",
    template: "%s | Beauty AI Shelf",
  },
  description:
    "ChatGPTやGeminiが、あなたの化粧品を薦めているか。美容に特化した質問で記録・比較し、薬機法に配慮した表現チェックまで行えるツールです。",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#171412" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
