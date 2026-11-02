import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center px-4 sm:px-6">
        <Link href="/" className="font-serif text-lg font-semibold tracking-wide">
          Beauty AI Shelf
        </Link>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-8 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-wide">{title}</h1>
        <p className="mt-2 text-xs text-ink-3">最終更新日：{updated}</p>
        <div className="mt-10 space-y-8 text-sm leading-loose [&_h2]:text-base [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
