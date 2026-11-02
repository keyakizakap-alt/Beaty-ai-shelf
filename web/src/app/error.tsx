"use client";

import { Button } from "@/components/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-xl font-bold">問題が発生しました</h1>
      <p className="mt-2 text-sm text-ink-2">お手数ですが、もう一度お試しください。入力したデータはブラウザに保存されています。</p>
      <div className="mt-8">
        <Button onClick={reset}>もう一度試す</Button>
      </div>
    </main>
  );
}
