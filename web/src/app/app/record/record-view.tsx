"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Highlight } from "@/components/highlight";
import { Button, EmptyState, Field, Notice, PageHeader, Section, textareaClass, inputClass } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { detectMentions } from "@/lib/detect";
import { newId } from "@/lib/storage";
import { ENGINES, type EngineId } from "@/lib/types";

const MAX_ANSWER = 20000;
const MAX_OBSERVATIONS = 2000;

export function RecordView() {
  const params = useSearchParams();
  const { workspace, update } = useWorkspace();
  const ws = workspace!;
  const initialQ = params.get("q");
  const [questionId, setQuestionId] = useState<string>(
    ws.questions.some((q) => q.id === initialQ) ? (initialQ as string) : (ws.questions[0]?.id ?? ""),
  );
  const [engine, setEngine] = useState<EngineId>("chatgpt");
  const [answer, setAnswer] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const brandById = useMemo(() => new Map(ws.brands.map((b) => [b.id, b])), [ws.brands]);
  const mentions = useMemo(() => detectMentions(answer, ws.brands), [answer, ws.brands]);
  const own = ws.brands.find((b) => b.isOwn)!;
  const ownMention = mentions.find((m) => m.brandId === own.id);

  if (ws.questions.length === 0) {
    return (
      <>
        <PageHeader title="回答の記録" />
        <EmptyState title="先に質問を作成してください" action={<Link className="text-accent underline underline-offset-4" href="/app/questions">質問を作る</Link>} />
      </>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const text = answer.trim();
    if (!questionId) return setError("質問を選んでください。");
    if (!text) return setError("AIの回答を貼り付けてください。");
    if (ws.observations.length >= MAX_OBSERVATIONS) return setError(`記録は${MAX_OBSERVATIONS}件までです。不要な記録を削除してください。`);
    update({
      ...ws,
      observations: [
        ...ws.observations,
        {
          id: newId(),
          questionId,
          engine,
          answerText: text.slice(0, MAX_ANSWER),
          createdAt: new Date().toISOString(),
          mentions: detectMentions(text.slice(0, MAX_ANSWER), ws.brands),
        },
      ],
    });
    setAnswer("");
    setSaved(ownMention ? `保存しました。自社ブランドは${ownMention.rank}番目に登場しています。` : "保存しました。この回答に自社ブランドは登場していません。");
  }

  function remove(id: string) {
    if (!window.confirm("この記録を削除しますか？")) return;
    update({ ...ws, observations: ws.observations.filter((o) => o.id !== id) });
  }

  const recent = [...ws.observations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
  const questionText = new Map(ws.questions.map((q) => [q.id, q.text]));
  const engineLabel = new Map(ENGINES.map((e) => [e.id, e.label]));

  return (
    <div>
      <PageHeader
        title="回答の記録"
        lead="AIに質問して得た回答を、そのまま貼り付けてください。登録したブランド名を探し、登場した順番を記録します。"
      />

      <form onSubmit={onSubmit} className="mb-10 grid gap-8 lg:grid-cols-[1fr_22rem]" noValidate>
        <div className="space-y-5">
          <Field label="質問" htmlFor="question">
            <select id="question" className={inputClass} value={questionId} onChange={(e) => setQuestionId(e.target.value)}>
              {ws.questions.map((q, i) => (
                <option key={q.id} value={q.id}>
                  {i + 1}. {q.text}
                </option>
              ))}
            </select>
          </Field>

          <fieldset>
            <legend className="text-sm font-medium">回答したAI</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ENGINES.map((e) => (
                <label
                  key={e.id}
                  className={`flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-sm ${
                    engine === e.id ? "border-accent bg-accent-soft font-medium" : "border-line-strong bg-surface text-ink-2"
                  }`}
                >
                  <input
                    type="radio"
                    name="engine"
                    value={e.id}
                    checked={engine === e.id}
                    onChange={() => setEngine(e.id)}
                    className="sr-only"
                  />
                  {e.label}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="AIの回答" htmlFor="answer" hint={`${answer.length.toLocaleString()} / ${MAX_ANSWER.toLocaleString()}文字`}>
            <textarea
              id="answer"
              className={`${textareaClass} min-h-56`}
              value={answer}
              maxLength={MAX_ANSWER}
              onChange={(e) => {
                setAnswer(e.target.value);
                setSaved(null);
              }}
              placeholder="ChatGPTなどの回答をここに貼り付け"
            />
          </Field>

          {error && (
            <div role="alert">
              <Notice tone="danger">{error}</Notice>
            </div>
          )}
          {saved && (
            <p role="status" className="text-sm font-medium text-ink">
              {saved}
            </p>
          )}
          <Button type="submit" disabled={!answer.trim()}>
            この回答を保存
          </Button>
        </div>

        <aside aria-labelledby="preview-title" className="lg:border-l lg:border-line lg:pl-8">
          <h2 id="preview-title" className="text-base font-bold">
            検出結果
          </h2>
          {!answer.trim() ? (
            <p className="mt-3 text-sm text-ink-3">回答を貼り付けると、ここにブランドの登場順が表示されます。</p>
          ) : (
            <div aria-live="polite">
              <p className="mt-3 text-sm">
                {ownMention ? (
                  <>
                    自社ブランド「{own.name}」は <strong className="text-lg">{ownMention.rank}番目</strong> に登場
                  </>
                ) : (
                  <>自社ブランド「{own.name}」は登場していません</>
                )}
              </p>
              {mentions.length > 0 ? (
                <ol className="mt-4 space-y-2">
                  {mentions.map((m) => {
                    const b = brandById.get(m.brandId)!;
                    return (
                      <li key={m.brandId} className="flex items-baseline gap-3 text-sm">
                        <span className="w-6 text-right font-serif text-ink-3">{m.rank}</span>
                        <span className={b.isOwn ? "font-bold" : ""}>{b.name}</span>
                        {b.isOwn && <span className="rounded-full bg-accent-soft px-2 text-xs">自社</span>}
                        <span className="text-xs text-ink-3">「{m.matched}」</span>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-4 text-sm text-ink-3">登録したブランドは見つかりませんでした。表記が違う場合は、ブランド設定の「別の表記」に追加してください。</p>
              )}
            </div>
          )}
        </aside>
      </form>

      {answer.trim() && mentions.length > 0 && (
        <Section title="回答内の位置">
          <div className="rounded-xl border border-line bg-surface p-4 text-sm">
            <Highlight
              text={answer}
              spans={mentions.map((m) => ({ start: m.index, end: m.index + m.matched.length, label: brandById.get(m.brandId)?.name ?? "" }))}
            />
          </div>
        </Section>
      )}

      <Section title={`最近の記録（全${ws.observations.length}件）`}>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-3">まだ記録はありません。</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {recent.map((o) => {
              const ownM = o.mentions.find((m) => m.brandId === own.id);
              return (
                <li key={o.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm">
                    <p className="font-medium">{questionText.get(o.questionId) ?? "（削除された質問）"}</p>
                    <p className="text-xs text-ink-3">
                      {engineLabel.get(o.engine)}・{new Date(o.createdAt).toLocaleString("ja-JP", { dateStyle: "medium", timeStyle: "short" })}・
                      {ownM ? `自社 ${ownM.rank}番目` : "自社の登場なし"}・登場ブランド {o.mentions.length}件
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => remove(o.id)} aria-label="この記録を削除">
                    削除
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
