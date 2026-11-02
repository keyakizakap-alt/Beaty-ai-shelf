"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { Button, Notice, PageHeader, Section } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { download } from "@/lib/csv";
import { clearWorkspace, parseWorkspace } from "@/lib/storage";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function DataView() {
  const router = useRouter();
  const { workspace, update } = useWorkspace();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ tone: "info" | "danger"; text: string } | null>(null);

  function exportJson() {
    if (!workspace) return;
    download(`beauty-ai-shelf-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(workspace, null, 2), "application/json");
  }

  async function onImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) return setMessage({ tone: "danger", text: "ファイルが大きすぎます（5MBまで）。" });
    try {
      const parsed = parseWorkspace(JSON.parse(await file.text()));
      if (!parsed.ok) return setMessage({ tone: "danger", text: `読み込めませんでした：${parsed.error}` });
      if (workspace && !window.confirm("今のデータを、読み込んだデータで置き換えます。よろしいですか？")) return;
      update(parsed.value);
      setMessage({ tone: "info", text: `読み込みました（質問${parsed.value.questions.length}件・記録${parsed.value.observations.length}件）。` });
    } catch {
      setMessage({ tone: "danger", text: "読み込めませんでした：JSONファイルではありません。" });
    }
  }

  function clearAll() {
    if (!window.confirm("この端末に保存されたブランド設定・質問・記録をすべて削除します。元に戻せません。よろしいですか？")) return;
    clearWorkspace();
    update(null);
    router.push("/app");
  }

  return (
    <div>
      <PageHeader title="データ管理" lead="データはこのブラウザの中だけに保存され、外部のサーバーには送信していません。別の端末で使うときや、保管したいときは書き出してください。" />

      {message && (
        <div className="mb-6" role={message.tone === "danger" ? "alert" : "status"}>
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      )}

      <Section title="書き出し" description="ブランド設定・質問・記録を、1つのファイル（JSON形式）に保存します。">
        <Button variant="secondary" onClick={exportJson} disabled={!workspace}>
          データを書き出す
        </Button>
      </Section>

      <Section title="読み込み" description="書き出したファイルを読み込みます。今のデータは置き換えられます。">
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" id="import" aria-label="読み込むファイル" tabIndex={-1} onChange={onImport} />
        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
          ファイルを選んで読み込む
        </Button>
      </Section>

      <Section title="すべて削除" description="この端末に保存されたデータを削除します。元に戻せないため、必要なら先に書き出してください。">
        <Button variant="danger" onClick={clearAll} disabled={!workspace}>
          すべてのデータを削除
        </Button>
      </Section>
    </div>
  );
}
