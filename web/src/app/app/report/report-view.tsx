"use client";

import { useMemo } from "react";
import { Button, ButtonLink, EmptyState, Notice, PageHeader, Section, pct } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { download, observationsToCsv } from "@/lib/csv";
import { computeReport } from "@/lib/metrics";
import { ENGINES } from "@/lib/types";

const MIN_RELIABLE = 10;

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-l-2 border-line pl-4">
      <p className="text-xs text-ink-3">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-ink-3">{note}</p>}
    </div>
  );
}

export function ReportView() {
  const { workspace } = useWorkspace();
  const ws = workspace!;
  const report = useMemo(() => computeReport(ws.observations, ws.brands, ws.questions), [ws]);
  const own = report.brandStats.find((b) => b.isOwn)!;
  const engineLabel = new Map(ENGINES.map((e) => [e.id, e.label]));
  const leader = report.brandStats.find((b) => !b.isOwn && b.mentioned > 0);
  const gaps = report.questionStats.filter((q) => q.gapAnswers > 0).sort((a, b) => b.gapAnswers - a.gapAnswers);

  if (report.totalAnswers === 0) {
    return (
      <>
        <PageHeader title="レポート" />
        <EmptyState title="まだ記録がありません" action={<ButtonLink href="/app/record">回答を記録する</ButtonLink>}>
          AIの回答を記録すると、自社ブランドが薦められた割合や、競合との差がここに表示されます。
        </EmptyState>
      </>
    );
  }

  const maxRate = Math.max(...report.brandStats.map((b) => b.mentionRate), 0.01);

  return (
    <div>
      <PageHeader
        title="レポート"
        lead="記録した回答をもとに集計しています。割合の分母は、記録した回答の数です。"
        action={
          <Button
            variant="secondary"
            onClick={() => download(`ai-recommendations-${new Date().toISOString().slice(0, 10)}.csv`, observationsToCsv(ws), "text/csv;charset=utf-8")}
          >
            CSVで書き出す
          </Button>
        }
      />

      {report.totalAnswers < MIN_RELIABLE && (
        <div className="mb-8">
          <Notice tone="warn">
            記録が{report.totalAnswers}件と少ないため、数字は参考値です。AIの回答は聞くたびに変わるので、{MIN_RELIABLE}件以上を目安に記録してください。
          </Notice>
        </div>
      )}

      <section aria-label="主な指標" className="mb-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Stat label="自社が登場した割合" value={pct(own.mentionRate)} note={`${own.mentioned} / ${report.totalAnswers}件の回答`} />
        <Stat label="登場したときの平均順位" value={own.avgRank !== null ? `${own.avgRank}番目` : "—"} note="1に近いほど先に挙げられています" />
        <Stat label="最初に挙げられた割合" value={pct(own.firstRate)} />
        <Stat label="記録した回答" value={`${report.totalAnswers}件`} note={`${report.byEngine.length}種類のAI`} />
      </section>

      <Section
        title="ブランドごとの登場割合"
        description="各ブランドが、記録した回答のうち何％に登場したか。"
      >
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-ink-2" aria-hidden>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-chart-own" /> 自社
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-chart-rival" /> 競合
          </span>
        </div>
        <ul className="space-y-3" aria-label="ブランドごとの登場割合のグラフ">
          {report.brandStats.map((b) => (
            <li key={b.brandId} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm sm:grid-cols-[10rem_1fr_3.5rem]">
              <span className={`truncate ${b.isOwn ? "font-bold" : ""}`} title={b.name}>
                {b.name}
                {b.isOwn && <span className="sr-only">（自社）</span>}
              </span>
              <span className="relative h-5" title={`${b.name}：${pct(b.mentionRate)}（${b.mentioned}件）`}>
                <span
                  className={`absolute inset-y-0 left-0 rounded-r ${b.isOwn ? "bg-chart-own" : "bg-chart-rival"}`}
                  style={{ width: `${Math.max((b.mentionRate / maxRate) * 100, b.mentionRate > 0 ? 1 : 0)}%` }}
                />
              </span>
              <span className="text-right tabular-nums">{pct(b.mentionRate)}</span>
            </li>
          ))}
        </ul>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-ink-2">表で見る</summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="border-b border-line text-xs text-ink-3">
                <tr>
                  <th className="py-2 font-medium">ブランド</th>
                  <th className="py-2 text-right font-medium">登場割合</th>
                  <th className="py-2 text-right font-medium">登場数</th>
                  <th className="py-2 text-right font-medium">平均順位</th>
                  <th className="py-2 text-right font-medium">1番目の割合</th>
                  <th className="py-2 text-right font-medium">言及シェア</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line tabular-nums">
                {report.brandStats.map((b) => (
                  <tr key={b.brandId}>
                    <td className={`py-2 ${b.isOwn ? "font-bold" : ""}`}>{b.name}</td>
                    <td className="py-2 text-right">{pct(b.mentionRate)}</td>
                    <td className="py-2 text-right">{b.mentioned}</td>
                    <td className="py-2 text-right">{b.avgRank ?? "—"}</td>
                    <td className="py-2 text-right">{pct(b.firstRate)}</td>
                    <td className="py-2 text-right">{pct(b.shareOfVoice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Section>

      <div className="grid gap-x-12 lg:grid-cols-2">
        <Section title="AIごとの自社の登場割合">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-ink-3">
              <tr>
                <th className="py-2 font-medium">AI</th>
                <th className="py-2 text-right font-medium">記録数</th>
                <th className="py-2 text-right font-medium">自社の登場割合</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line tabular-nums">
              {report.byEngine.map((e) => (
                <tr key={e.engine}>
                  <td className="py-2">{engineLabel.get(e.engine)}</td>
                  <td className="py-2 text-right">{e.answers}</td>
                  <td className="py-2 text-right">{pct(e.ownRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="週ごとの推移" description="週（月曜はじまり）ごとの、自社の登場割合。">
          {report.weekly.length < 2 ? (
            <p className="text-sm text-ink-3">2週以上記録すると、推移が表示されます。</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-ink-3">
                <tr>
                  <th className="py-2 font-medium">週</th>
                  <th className="py-2 font-medium">自社の登場割合</th>
                  <th className="py-2 text-right font-medium">記録数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line tabular-nums">
                {report.weekly.map((w) => (
                  <tr key={w.weekStart}>
                    <td className="py-2 whitespace-nowrap">{w.weekStart.slice(5).replace("-", "/")}〜</td>
                    <td className="py-2">
                      <span className="flex items-center gap-2" title={`${w.weekStart}の週：${pct(w.ownRate)}`}>
                        <span className="h-3 rounded-r bg-chart-own" style={{ width: `${Math.max(w.ownRate * 8, w.ownRate > 0 ? 0.25 : 0)}rem` }} />
                        {pct(w.ownRate)}
                      </span>
                    </td>
                    <td className="py-2 text-right">{w.answers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      </div>

      <Section
        title="改善の手がかり"
        description="自社が登場せず、競合だけが登場した質問です。消費者がこう聞いたときに、AIが自社を知らない・薦める理由を見つけられていない可能性があります。"
      >
        {gaps.length === 0 ? (
          <p className="text-sm text-ink-3">競合だけが登場した回答はありません。</p>
        ) : (
          <ol className="divide-y divide-line border-y border-line">
            {gaps.map((q) => (
              <li key={q.questionId} className="py-4">
                <p className="font-medium leading-relaxed">{q.text}</p>
                <p className="mt-1 text-sm text-ink-2">
                  {q.answers}件中{q.gapAnswers}件で自社が登場せず、
                  {q.topCompetitors.map((c) => `${c.name}（${c.count}件）`).join("、")}が登場しました。
                </p>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-6">
          <Notice>
            次の打ち手の例：自社サイトの商品ページに、この質問に答える情報（どんな悩み・年代向けか、価格、使い方、成分）を、化粧品の効能の範囲で明記する。文案は「表現チェック」で確認してから公開してください。
            {leader && `現在もっとも登場しているのは${leader.name}（${pct(leader.mentionRate)}）です。`}
          </Notice>
        </div>
      </Section>

      <Section title="質問ごとの結果">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="表（横にスクロールできます）">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-line text-xs text-ink-3">
              <tr>
                <th className="py-2 font-medium">質問</th>
                <th className="py-2 text-right font-medium">記録数</th>
                <th className="py-2 text-right font-medium">自社の登場</th>
                <th className="py-2 font-medium pl-4">よく登場した競合</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.questionStats.map((q) => (
                <tr key={q.questionId}>
                  <td className="py-2 pr-4">{q.text}</td>
                  <td className="py-2 text-right tabular-nums">{q.answers}</td>
                  <td className="py-2 text-right tabular-nums">{q.ownMentioned}</td>
                  <td className="py-2 pl-4 text-ink-2">{q.topCompetitors.map((c) => c.name).join("、") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
