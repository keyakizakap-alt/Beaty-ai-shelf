"use client";

import { useMemo, useState } from "react";
import { Highlight } from "@/components/highlight";
import { Notice, PageHeader, Section, textareaClass } from "@/components/ui";
import { COSMETIC_EFFICACY_56, SEVERITY_LABEL, checkText, type ProductType, type Severity } from "@/lib/yakki";

const MAX = 10000;

const severityStyle: Record<Severity, string> = {
  high: "bg-danger-soft text-danger border-danger/40",
  medium: "bg-warn-soft text-warn border-warn/40",
  low: "bg-info-soft text-info border-info/40",
};

const markStyle: Record<Severity, string> = {
  high: "!bg-danger-soft underline decoration-danger decoration-2 underline-offset-4",
  medium: "!bg-warn-soft underline decoration-warn decoration-2 underline-offset-4",
  low: "!bg-info-soft underline decoration-info decoration-dotted underline-offset-4",
};

export function CheckView() {
  const [text, setText] = useState("");
  const [productType, setProductType] = useState<ProductType>("cosmetic");
  const findings = useMemo(() => checkText(text, productType), [text, productType]);
  const counts = {
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
  };

  return (
    <div>
      <PageHeader
        title="表現チェック"
        lead="商品ページ・広告・SNS投稿の文章を貼り付けると、化粧品で使えない可能性がある表現を探します。AIの推薦を増やすために情報を足すときも、公開前にここで確認してください。"
      />

      <div className="mb-8">
        <Notice tone="warn">
          このチェックはルールにもとづく一次確認です。違反かどうかは広告全体の文脈で判断されるため、問題がないことを保証するものではありません。公開前の最終判断は、薬事の専門家に確認してください。
        </Notice>
      </div>

      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <fieldset>
            <legend className="text-sm font-medium">商品の種類</legend>
            <div className="mt-2 flex gap-2">
              {(
                [
                  ["cosmetic", "化粧品"],
                  ["quasi_drug", "医薬部外品（薬用化粧品）"],
                ] as const
              ).map(([v, label]) => (
                <label
                  key={v}
                  className={`flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm ${
                    productType === v ? "border-accent bg-accent-soft font-medium" : "border-line-strong bg-surface text-ink-2"
                  }`}
                >
                  <input type="radio" name="ptype" className="sr-only" checked={productType === v} onChange={() => setProductType(v)} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="copy" className="text-sm font-medium">
              確認する文章
            </label>
            <textarea
              id="copy"
              className={`${textareaClass} mt-1.5 min-h-72`}
              value={text}
              maxLength={MAX}
              onChange={(e) => setText(e.target.value)}
              placeholder="例：たった1週間でシミが消える！皮膚科医も推薦する美容液。"
            />
            <p className="mt-1 text-xs text-ink-3">
              {text.length.toLocaleString()} / {MAX.toLocaleString()}文字。入力した文章はこの端末の中だけで処理し、外部には送信しません。
            </p>
          </div>
        </div>

        <div aria-live="polite">
          <h2 className="text-base font-bold">結果</h2>
          {!text.trim() ? (
            <p className="mt-3 text-sm text-ink-3">文章を入力すると、結果がここに表示されます。</p>
          ) : findings.length === 0 ? (
            <p className="mt-3 text-sm">ルールに当てはまる表現は見つかりませんでした。文脈によっては問題になる場合があるため、最終確認は専門家に依頼してください。</p>
          ) : (
            <>
              <p className="mt-3 text-sm">
                {SEVERITY_LABEL.high} <strong>{counts.high}</strong>件・{SEVERITY_LABEL.medium} <strong>{counts.medium}</strong>件
                {counts.low > 0 && <>・{SEVERITY_LABEL.low} <strong>{counts.low}</strong>件</>}
              </p>
              <div className="mt-4 rounded-xl border border-line bg-surface p-4 text-sm">
                <Highlight
                  text={text}
                  spans={findings.map((f) => ({ start: f.start, end: f.end, label: `${SEVERITY_LABEL[f.severity]}：${f.category}`, className: markStyle[f.severity] }))}
                />
              </div>
              <ol className="mt-6 space-y-5">
                {findings.map((f, i) => (
                  <li key={`${f.ruleId}-${f.start}`} className="border-l-2 border-line pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${severityStyle[f.severity]}`}>
                        {SEVERITY_LABEL[f.severity]}
                      </span>
                      <span className="text-sm font-bold">
                        {i + 1}.「{f.text}」
                      </span>
                      <span className="text-xs text-ink-3">{f.category}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{f.reason}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-2">
                      <span className="font-medium text-ink">言い換えの方向：</span>
                      {f.suggestion}
                    </p>
                    <p className="mt-1 text-xs text-ink-3">根拠：{f.source}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>

      <Section title="化粧品で表現できる効能（56項目）" description="平成23年7月21日 薬食発0721第1号「化粧品の効能の範囲の改正について」。メーキャップ効果や使用感の表現はこの範囲外でも認められる場合があります。">
        <details>
          <summary className="cursor-pointer text-sm text-ink-2">一覧を開く</summary>
          <ol className="mt-4 grid list-decimal gap-x-10 gap-y-1 pl-6 text-sm sm:grid-cols-2">
            {COSMETIC_EFFICACY_56.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ol>
        </details>
      </Section>
    </div>
  );
}
