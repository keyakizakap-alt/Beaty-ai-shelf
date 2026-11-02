"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, ButtonLink, Field, Notice, inputClass, pct } from "@/components/ui";
import type { DiagnosisResult } from "@/lib/diagnosis";
import { CATEGORIES, CONCERNS } from "@/lib/questions";

type Status = { state: "loading" } | { state: "ready"; engines: string[] } | { state: "unavailable" } | { state: "error" };

export function DiagnosisView() {
  const [status, setStatus] = useState<Status>({ state: "loading" });
  const [brand, setBrand] = useState("");
  const [aliases, setAliases] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [concern, setConcern] = useState<string>(CONCERNS[0]);
  const [website, setWebsite] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/diagnosis", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { available: boolean; engines: string[] }) => {
        if (alive) setStatus(d.available ? { state: "ready", engines: d.engines } : { state: "unavailable" });
      })
      .catch(() => alive && setStatus({ state: "error" }));
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!brand.trim()) return setError("ブランド名を入力してください。");
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, aliases, competitors, category, concern, website }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.message ?? "診断できませんでした。時間をおいてお試しください。");
        if (res.status === 503) setStatus({ state: "unavailable" });
      } else {
        setResult(data as DiagnosisResult);
      }
    } catch {
      setError("通信に失敗しました。接続を確認して、もう一度お試しください。");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <p className="text-sm tracking-widest text-accent">無料診断</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-snug tracking-wide sm:text-4xl">
        AIは、あなたのブランドを薦めていますか。
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-loose text-ink-2">
        ブランド名とカテゴリを入れると、消費者がAIに聞きそうな質問をいくつか投げかけ、あなたのブランドが回答に登場したか、何番目に挙げられたかを確認します。
      </p>

      <div className="mt-10">
        {status.state === "loading" && <div aria-busy="true" className="h-40 animate-pulse rounded-xl bg-surface-muted" />}

        {(status.state === "unavailable" || status.state === "error") && (
          <div className="space-y-6">
            <Notice tone="warn">
              {status.state === "unavailable"
                ? "無料診断（AIへの自動の質問）は、現在準備中です。"
                : "診断の状態を確認できませんでした。時間をおいて再度お試しください。"}
              <br />
              それまでは、AIへの質問をご自身で行い、回答を貼り付けて記録・集計する無料ツールをお使いいただけます。
            </Notice>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/app/setup">無料の記録ツールを使う</ButtonLink>
              <ButtonLink href="/app/check" variant="secondary">
                表現チェックを使う
              </ButtonLink>
            </div>
          </div>
        )}

        {status.state === "ready" && (
          <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
            <Field label="ブランド名" htmlFor="d-brand">
              <input id="d-brand" className={inputClass} value={brand} maxLength={60} onChange={(e) => setBrand(e.target.value)} required />
            </Field>
            <Field label="別の表記（任意・読点区切り）" htmlFor="d-aliases" hint="英字表記やカタカナなど">
              <input id="d-aliases" className={inputClass} value={aliases} onChange={(e) => setAliases(e.target.value)} />
            </Field>
            <Field label="カテゴリ" htmlFor="d-category">
              <select id="d-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="狙う悩み" htmlFor="d-concern">
              <select id="d-concern" className={inputClass} value={concern} onChange={(e) => setConcern(e.target.value)}>
                {CONCERNS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="比べたい競合ブランド（任意・5つまで・読点区切り）" htmlFor="d-competitors">
                <input id="d-competitors" className={inputClass} value={competitors} onChange={(e) => setCompetitors(e.target.value)} />
              </Field>
            </div>
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="d-website">ウェブサイト（入力しないでください）</label>
              <input id="d-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              {error && (
                <div role="alert" className="mb-4">
                  <Notice tone="danger">{error}</Notice>
                </div>
              )}
              <Button type="submit" disabled={running}>
                {running ? "AIに質問しています…（1分ほどかかります）" : "無料で診断する"}
              </Button>
              <p className="mt-3 text-xs text-ink-3">
                質問先：{status.engines.join("、")}。AIに送るのは、カテゴリと悩みから作った一般的な質問文だけで、ブランド名は送りません。ブランド名は回答の中から探すためだけに使い、診断結果とあわせて保存しません。
              </p>
            </div>
          </form>
        )}
      </div>

      {running && (
        <p role="status" className="mt-6 text-sm text-ink-2">
          消費者がよく聞く形の質問を、AIに順番に投げかけています。このままお待ちください。
        </p>
      )}

      {result && <DiagnosisReport result={result} />}
    </div>
  );
}

function DiagnosisReport({ result }: { result: DiagnosisResult }) {
  const total = result.answers.length;
  const qText = new Map(result.questions.map((q) => [q.id, q.text]));
  const failed = result.engines.reduce((s, e) => s + e.failed, 0);
  return (
    <section aria-labelledby="result-title" className="mt-14 border-t border-line pt-10">
      <h2 id="result-title" className="font-serif text-2xl font-semibold">
        「{result.brand}」の診断結果
      </h2>
      <p className="mt-1 text-xs text-ink-3">
        {new Date(result.measuredAt).toLocaleString("ja-JP")}時点・{total}件の回答。AIの回答は聞くたびに変わるため、1回の診断は傾向をつかむための参考値です。
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-3">あなたのブランドが登場した割合</p>
          <p className="mt-1 font-serif text-5xl font-semibold tabular-nums">{pct(result.ownRate)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-3">登場したときの平均順位</p>
          <p className="mt-1 font-serif text-5xl font-semibold tabular-nums">{result.ownAvgRank ? `${result.ownAvgRank}番目` : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-ink-3">AIごと</p>
          <ul className="mt-2 space-y-1 text-sm">
            {result.engines.map((e) => (
              <li key={e.id}>
                {e.label}：{e.answered ? pct(e.ownRate) : "取得できず"}
                {e.failed > 0 && <span className="text-xs text-ink-3">（{e.failed}件失敗）</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {failed > 0 && (
        <div className="mt-6">
          <Notice tone="warn">一部の質問でAIからの回答を取得できませんでした。取得できた回答だけで集計しています。</Notice>
        </div>
      )}

      {result.competitors.length > 0 && (
        <div className="mt-10">
          <h3 className="font-bold">競合ブランドの登場割合</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {result.competitors.map((c) => (
              <li key={c.name}>
                {c.name}：{pct(c.rate)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.topDomains.length > 0 && (
        <div className="mt-10">
          <h3 className="font-bold">AIが参照したサイト</h3>
          <p className="mt-1 text-sm text-ink-3">ここに載っているサイトに正確な情報があると、AIに取り上げられやすくなる可能性があります。</p>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {result.topDomains.map((d) => (
              <li key={d.domain} className="rounded-full border border-line px-3 py-1">
                {d.domain}（{d.count}）
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <h3 className="font-bold">質問ごとの回答</h3>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {result.answers.map((a, i) => (
            <li key={i} className="py-4 text-sm">
              <p className="font-medium">{qText.get(a.questionId)}</p>
              <p className="mt-1 text-xs text-ink-3">
                {result.engines.find((e) => e.id === a.engine)?.label}・
                {a.ownRank ? `あなたのブランドは${a.ownRank}番目` : "あなたのブランドは登場せず"}
                {a.mentionedBrands.length > 0 && `・登場：${a.mentionedBrands.join("、")}`}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-ink-2">回答の冒頭を見る</summary>
                <p className="mt-2 whitespace-pre-wrap text-ink-2">{a.excerpt}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 rounded-xl bg-surface-muted p-6">
        <p className="font-bold">次にできること</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          継続的に記録すると、週ごとの変化や、競合だけが薦められる質問が見えてきます。商品ページを見直すときは、表現チェックで薬機法の観点も確認できます。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/app/setup">記録ツールで続ける</ButtonLink>
          <ButtonLink href="/app/check" variant="secondary">
            表現チェック
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
