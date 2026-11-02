import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { DiagnosisView } from "./diagnosis-view";

export const metadata: Metadata = {
  title: "無料診断",
  description: "ブランド名を入れるだけで、ChatGPTやGeminiがあなたの化粧品を薦めているかを確認できます。",
};

export default function DiagnosisPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-serif text-lg font-semibold tracking-wide">
          Beauty AI Shelf
        </Link>
        <Link href="/app" className="text-sm font-medium text-ink-2 hover:text-ink">
          記録ツールを開く
        </Link>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-8 sm:px-6">
        <DiagnosisView />
      </main>
      <SiteFooter />
    </div>
  );
}
