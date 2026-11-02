import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Beauty AI Shelf（試作版）</p>
        <nav aria-label="フッター">
          <ul className="flex gap-5">
            <li>
              <Link href="/terms" className="hover:text-ink">
                利用規約
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-ink">
                プライバシーポリシー
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
