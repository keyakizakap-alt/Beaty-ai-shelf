"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button, ButtonLink, PageHeader, pct } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { computeReport } from "@/lib/metrics";
import { sampleWorkspace } from "@/lib/sample";

function Step({ done, n, title, children, href, cta }: { done: boolean; n: number; title: string; children: React.ReactNode; href: string; cta: string }) {
  return (
    <li className="grid grid-cols-[2.5rem_1fr] gap-4 border-b border-line py-6 sm:grid-cols-[2.5rem_1fr_auto] sm:items-center">
      <span
        aria-hidden
        className={`flex h-10 w-10 items-center justify-center rounded-full border font-serif text-lg ${
          done ? "border-accent bg-accent text-accent-ink" : "border-line-strong text-ink-2"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <div>
        <h3 className="font-bold">
          {title}
          {done && <span className="ml-2 text-xs font-normal text-ink-3">完了</span>}
        </h3>
        <p className="mt-1 text-sm text-ink-2">{children}</p>
      </div>
      <div className="col-start-2 sm:col-start-auto">
        <ButtonLink href={href} variant={done ? "secondary" : "primary"}>
          {cta}
        </ButtonLink>
      </div>
    </li>
  );
}

export function Overview() {
  const router = useRouter();
  const { workspace, update } = useWorkspace();
  const report = useMemo(
    () => (workspace ? computeReport(workspace.observations, workspace.brands, workspace.questions) : null),
    [workspace],
  );

  if (workspace === undefined) {
    return <div aria-busy="true" className="h-60 animate-pulse rounded-xl bg-surface-muted" />;
  }

  const own = workspace?.brands.find((b) => b.isOwn);
  const hasBrand = !!own;
  const hasQuestions = (workspace?.questions.length ?? 0) > 0;
  const hasRecords = (workspace?.observations.length ?? 0) > 0;
  const ownStat = report?.brandStats.find((b) => b.isOwn);

  return (
    <div>
      <PageHeader
        title={own ? `${own.name} のAI推薦状況` : "はじめに"}
        lead="消費者がAIに化粧品の相談をしたとき、あなたのブランドが薦められているかを記録・比較します。"
      />

      {hasRecords && ownStat && report && (
        <section aria-label="現在の状況" className="mb-12 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-ink-3">自社が登場した割合</p>
            <p className="mt-1 font-serif text-4xl font-semibold tabular-nums">{pct(ownStat.mentionRate)}</p>
            <p className="text-xs text-ink-3">{report.totalAnswers}件の回答のうち{ownStat.mentioned}件</p>
          </div>
          <div>
            <p className="text-xs text-ink-3">平均順位</p>
            <p className="mt-1 font-serif text-4xl font-semibold tabular-nums">{ownStat.avgRank ? `${ownStat.avgRank}番目` : "—"}</p>
          </div>
          <div className="flex items-end">
            <Link href="/app/report" className="text-sm font-medium text-accent underline underline-offset-4">
              レポートを詳しく見る
            </Link>
          </div>
        </section>
      )}

      <h2 className="text-base font-bold">使い方</h2>
      <ol className="mt-2 border-t border-line">
        <Step done={hasBrand} n={1} title="ブランドを設定する" href="/app/setup" cta={hasBrand ? "設定を見直す" : "設定する"}>
          自社ブランドと競合ブランド、狙うカテゴリ・悩み・年代を登録します。
        </Step>
        <Step done={hasQuestions} n={2} title="AIに質問する" href="/app/questions" cta="質問を見る">
          自動で作った質問をコピーして、ChatGPTやGeminiに聞きます。
        </Step>
        <Step done={hasRecords} n={3} title="回答を記録する" href="/app/record" cta="記録する">
          返ってきた回答を貼り付けると、ブランドの登場順を自動で数えます。
        </Step>
        <Step done={false} n={4} title="差を見て、表現を整える" href="/app/check" cta="表現チェック">
          競合だけが薦められた質問を確認し、商品ページの文章を薬機法の観点で確認します。
        </Step>
      </ol>

      {!hasBrand && (
        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-2">架空のブランドで作ったサンプルで、レポートの見え方を先に確認することもできます。</p>
          <Button
            variant="secondary"
            onClick={() => {
              update(sampleWorkspace());
              router.push("/app/report");
            }}
          >
            サンプルで試す
          </Button>
        </div>
      )}
    </div>
  );
}
