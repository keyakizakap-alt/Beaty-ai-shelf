"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useWorkspace } from "./workspace-provider";
import { ButtonLink, EmptyState, Notice } from "./ui";

const NAV = [
  { href: "/app", label: "概要", short: "概要" },
  { href: "/app/questions", label: "質問", short: "質問" },
  { href: "/app/record", label: "回答の記録", short: "記録" },
  { href: "/app/report", label: "レポート", short: "レポート" },
  { href: "/app/check", label: "表現チェック", short: "表現" },
];

const SUB_NAV = [
  { href: "/app/setup", label: "ブランド設定" },
  { href: "/app/data", label: "データ管理" },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { saveError, workspace } = useWorkspace();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        本文へ移動
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/app" className="font-serif text-lg font-semibold tracking-wide">
            Beauty AI Shelf
          </Link>
          <nav aria-label="メインメニュー" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(pathname, n.href) ? "page" : undefined}
                    className={`rounded-full px-3 py-2 text-sm ${
                      isActive(pathname, n.href) ? "bg-surface-muted font-bold text-ink" : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="設定メニュー">
            <ul className="flex items-center gap-1">
              {SUB_NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={isActive(pathname, n.href) ? "page" : undefined}
                    className={`rounded-full px-3 py-2 text-xs sm:text-sm ${
                      isActive(pathname, n.href) ? "font-bold text-ink underline underline-offset-4" : "text-ink-3 hover:text-ink"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-8 sm:px-6 md:pb-16">
        {workspace?.sample && (
          <div className="mb-6">
            <Notice tone="warn">
              架空のブランドで作ったサンプルデータを表示しています。自分のデータで始めるときは
              <Link href="/app/data" className="mx-1 font-medium underline underline-offset-4">
                データ管理
              </Link>
              から消去してください。
            </Notice>
          </div>
        )}
        {saveError && (
          <div className="mb-6">
            <Notice tone="danger">
              ブラウザにデータを保存できませんでした。プライベートブラウズや保存容量の上限が原因の可能性があります。「データ管理」から書き出して保管してください。
            </Notice>
          </div>
        )}
        {children}
      </main>

      <nav aria-label="メインメニュー（スマートフォン）" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={isActive(pathname, n.href) ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center text-xs ${
                  isActive(pathname, n.href) ? "font-bold text-accent" : "text-ink-2"
                }`}
              >
                <span aria-hidden className={`mb-1 h-1 w-6 rounded-full ${isActive(pathname, n.href) ? "bg-accent" : "bg-transparent"}`} />
                {n.short}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** ワークスペース（自社ブランド設定）が必要な画面を包む */
export function RequireBrand({ children }: { children: ReactNode }) {
  const { workspace } = useWorkspace();
  if (workspace === undefined) {
    return (
      <div aria-busy="true" aria-live="polite" className="space-y-4">
        <span className="sr-only">読み込み中です</span>
        <div className="h-8 w-48 animate-pulse rounded bg-surface-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-surface-muted" />
      </div>
    );
  }
  if (!workspace || !workspace.brands.some((b) => b.isOwn)) {
    return (
      <EmptyState
        title="まず、自社ブランドと競合ブランドを設定してください"
        action={<ButtonLink href="/app/setup">ブランドを設定する</ButtonLink>}
      >
        設定したブランド名をもとに、AIの回答の中から言及を数えます。
      </EmptyState>
    );
  }
  return <>{children}</>;
}
