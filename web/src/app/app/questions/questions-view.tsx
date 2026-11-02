"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button, EmptyState, Notice, PageHeader, Section, inputClass } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { generateQuestions } from "@/lib/questions";
import { newId } from "@/lib/storage";

const MAX_QUESTIONS = 50;

export function QuestionsView() {
  const { workspace, update } = useWorkspace();
  const [draft, setDraft] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  if (!workspace) return null;
  const ws = workspace;

  const counts = new Map<string, number>();
  for (const o of ws.observations) counts.set(o.questionId, (counts.get(o.questionId) ?? 0) + 1);

  function addQuestion(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (ws.questions.length >= MAX_QUESTIONS) return setMessage(`質問は${MAX_QUESTIONS}件までです。`);
    if (ws.questions.some((q) => q.text === text)) return setMessage("同じ質問がすでにあります。");
    update({ ...ws, questions: [...ws.questions, { id: newId(), text: text.slice(0, 500), generated: false }] });
    setDraft("");
    setMessage(null);
  }

  function regenerate() {
    const existing = new Set(ws.questions.map((q) => q.text));
    const fresh = generateQuestions(ws.profile, 20).filter((t) => !existing.has(t));
    const room = MAX_QUESTIONS - ws.questions.length;
    const add = fresh.slice(0, Math.max(0, room)).map((text) => ({ id: newId(), text, generated: true }));
    update({ ...ws, questions: [...ws.questions, ...add] });
    setMessage(add.length ? `${add.length}件の質問を追加しました。` : "追加できる新しい質問はありません。ブランド設定で悩みや年代を増やすと、質問の種類が増えます。");
  }

  function remove(id: string) {
    const n = counts.get(id) ?? 0;
    if (n > 0 && !window.confirm(`この質問には${n}件の記録があります。記録ごと削除しますか？`)) return;
    update({
      ...ws,
      questions: ws.questions.filter((q) => q.id !== id),
      observations: ws.observations.filter((o) => o.questionId !== id),
    });
  }

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      setMessage("コピーできませんでした。質問文を選択してコピーしてください。");
    }
  }

  return (
    <div>
      <PageHeader
        title="質問"
        lead="消費者がAIに聞きそうな質問の一覧です。質問をコピーしてChatGPTやGeminiに貼り付け、返ってきた回答を「回答の記録」に貼り付けてください。"
        action={
          <Button variant="secondary" onClick={regenerate}>
            質問を自動で追加
          </Button>
        }
      />

      <div className="mb-8">
        <Notice>
          AIの回答は、履歴やログイン状態によって変わります。傾向をつかむには、ログアウトした状態や新しい会話で、同じ質問を複数回聞くことをおすすめします。
        </Notice>
      </div>

      {message && (
        <p role="status" className="mb-4 text-sm text-ink-2">
          {message}
        </p>
      )}

      <Section title={`質問一覧（${ws.questions.length}件）`}>
        {ws.questions.length === 0 ? (
          <EmptyState title="質問がありません" action={<Button onClick={regenerate}>質問を自動で作る</Button>}>
            ブランド設定で選んだカテゴリ・悩み・年代から作成します。
          </EmptyState>
        ) : (
          <ol className="divide-y divide-line border-y border-line">
            {ws.questions.map((q, i) => (
              <li key={q.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 gap-3">
                  <span className="w-6 shrink-0 pt-0.5 text-right font-serif text-sm text-ink-3">{i + 1}</span>
                  <div>
                    <p className="leading-relaxed">{q.text}</p>
                    <p className="mt-1 text-xs text-ink-3">
                      {q.generated ? "自動作成" : "手動で追加"}・記録 {counts.get(q.id) ?? 0}件
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 pl-9 sm:pl-0">
                  <Button variant="secondary" onClick={() => copy(q.id, q.text)} aria-label={`質問${i + 1}をコピー`}>
                    {copiedId === q.id ? "コピーしました" : "コピー"}
                  </Button>
                  <Link
                    href={`/app/record?q=${q.id}`}
                    className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-accent hover:bg-accent-soft"
                  >
                    記録する
                  </Link>
                  <Button variant="ghost" onClick={() => remove(q.id)} aria-label={`質問${i + 1}を削除`}>
                    削除
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="質問を自分で追加">
        <form onSubmit={addQuestion} className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="new-question" className="sr-only">
            追加する質問
          </label>
          <input
            id="new-question"
            className={inputClass}
            value={draft}
            maxLength={500}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="例：混合肌で毛穴が気になる30代におすすめの化粧水は？"
          />
          <Button type="submit" disabled={!draft.trim()}>
            追加
          </Button>
        </form>
      </Section>
    </div>
  );
}
