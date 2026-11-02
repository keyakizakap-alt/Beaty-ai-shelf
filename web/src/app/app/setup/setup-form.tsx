"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Chip, Field, Notice, PageHeader, Section, inputClass } from "@/components/ui";
import { useWorkspace } from "@/components/workspace-provider";
import { AGE_BANDS, CATEGORIES, CONCERNS, PRICE_BANDS, generateQuestions } from "@/lib/questions";
import { sampleWorkspace } from "@/lib/sample";
import { emptyWorkspace, newId, recomputeMentions } from "@/lib/storage";
import type { Brand, Profile } from "@/lib/types";

const MAX_COMPETITORS = 10;

interface BrandDraft {
  id: string;
  name: string;
  aliases: string;
}

function toDraft(b: Brand): BrandDraft {
  return { id: b.id, name: b.name, aliases: b.aliases.join("、") };
}

function splitAliases(s: string): string[] {
  return s
    .split(/[、,，\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function SetupForm() {
  const { workspace } = useWorkspace();
  if (workspace === undefined) {
    return <div aria-busy="true" className="h-40 animate-pulse rounded-xl bg-surface-muted" />;
  }
  // 保存のたびに初期値を読み直すため、更新日時をキーにする
  return <SetupFormInner key={workspace?.updatedAt ?? "new"} />;
}

function SetupFormInner() {
  const router = useRouter();
  const { workspace, update } = useWorkspace();
  const ws = workspace ?? emptyWorkspace();
  const ownBrand = ws.brands.find((b) => b.isOwn);

  const [own, setOwn] = useState<BrandDraft>(ownBrand ? toDraft(ownBrand) : { id: newId(), name: "", aliases: "" });
  const [rivals, setRivals] = useState<BrandDraft[]>(() => {
    const r = ws.brands.filter((b) => !b.isOwn).map(toDraft);
    return r.length ? r : [{ id: newId(), name: "", aliases: "" }];
  });
  const [profile, setProfile] = useState<Profile>(ws.profile);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: "concerns" | "ageBands", value: string) =>
    setProfile((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value],
    }));

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const ownName = own.name.trim();
    if (!ownName) return setError("自社ブランド名を入力してください。");
    const rivalBrands = rivals
      .filter((r) => r.name.trim())
      .map<Brand>((r) => ({ id: r.id, name: r.name.trim().slice(0, 80), aliases: splitAliases(r.aliases), isOwn: false }));
    if (rivalBrands.length === 0) return setError("比較する競合ブランドを1つ以上入力してください。");
    const names = [ownName, ...rivalBrands.map((r) => r.name)].map((n) => n.toLowerCase());
    if (new Set(names).size !== names.length) return setError("同じブランド名が重複しています。");
    if (profile.concerns.length === 0) return setError("肌・髪の悩みを1つ以上選んでください。");
    if (profile.ageBands.length === 0) return setError("年代を1つ以上選んでください。");

    const brands: Brand[] = [
      { id: own.id, name: ownName.slice(0, 80), aliases: splitAliases(own.aliases), isOwn: true },
      ...rivalBrands,
    ];
    const questions =
      ws.questions.length > 0
        ? ws.questions
        : generateQuestions(profile, 12).map((text) => ({ id: newId(), text, generated: true }));
    update(recomputeMentions({ ...ws, brands, profile, questions }));
    router.push(ws.questions.length > 0 ? "/app" : "/app/questions");
  }

  function loadSample() {
    if (ws.observations.length > 0 && !window.confirm("今のデータをサンプルで置き換えます。よろしいですか？")) return;
    update(sampleWorkspace());
    router.push("/app/report");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <PageHeader
        title="ブランド設定"
        lead="自社ブランドと、比較したい競合ブランドを登録します。AIの回答の中からこれらの名前を探して数えます。英字表記・カタカナ・略称など、AIが使いそうな表記は「別の表記」に入れてください。"
      />

      {!ownBrand && (
        <div className="mb-8">
          <Notice>
            まずは操作感を確かめたい場合は、架空のブランドで作った
            <button type="button" onClick={loadSample} className="mx-1 font-medium text-accent underline underline-offset-4">
              サンプルデータ
            </button>
            を読み込めます。
          </Notice>
        </div>
      )}

      <Section title="自社ブランド">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ブランド名" htmlFor="own-name">
            <input
              id="own-name"
              className={inputClass}
              value={own.name}
              onChange={(e) => setOwn({ ...own, name: e.target.value })}
              placeholder="例：ミナモ"
              maxLength={80}
              required
            />
          </Field>
          <Field label="別の表記（読点で区切る）" htmlFor="own-aliases" hint="例：MINAMO、みなも">
            <input
              id="own-aliases"
              className={inputClass}
              value={own.aliases}
              onChange={(e) => setOwn({ ...own, aliases: e.target.value })}
            />
          </Field>
        </div>
      </Section>

      <Section title="競合ブランド" description={`最大${MAX_COMPETITORS}ブランドまで登録できます。`}>
        <ul className="space-y-4">
          {rivals.map((r, i) => (
            <li key={r.id} className="grid gap-3 border-b border-line pb-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label={`競合 ${i + 1}：ブランド名`} htmlFor={`rival-${r.id}`}>
                <input
                  id={`rival-${r.id}`}
                  className={inputClass}
                  value={r.name}
                  maxLength={80}
                  onChange={(e) => setRivals(rivals.map((x) => (x.id === r.id ? { ...x, name: e.target.value } : x)))}
                />
              </Field>
              <Field label="別の表記" htmlFor={`rival-alias-${r.id}`}>
                <input
                  id={`rival-alias-${r.id}`}
                  className={inputClass}
                  value={r.aliases}
                  onChange={(e) => setRivals(rivals.map((x) => (x.id === r.id ? { ...x, aliases: e.target.value } : x)))}
                />
              </Field>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRivals(rivals.filter((x) => x.id !== r.id))}
                disabled={rivals.length === 1}
                aria-label={`競合 ${i + 1} を削除`}
              >
                削除
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          disabled={rivals.length >= MAX_COMPETITORS}
          onClick={() => setRivals([...rivals, { id: newId(), name: "", aliases: "" }])}
        >
          競合ブランドを追加
        </Button>
      </Section>

      <Section title="狙う市場" description="ここで選んだ内容から、消費者がAIに聞きそうな質問を作ります。">
        <div className="space-y-6">
          <Field label="商品カテゴリ" htmlFor="category">
            <select
              id="category"
              className={`${inputClass} sm:max-w-xs`}
              value={profile.category}
              onChange={(e) => setProfile({ ...profile, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <fieldset>
            <legend className="text-sm font-medium">肌・髪の悩み（複数選択）</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONCERNS.map((c) => (
                <Chip key={c} selected={profile.concerns.includes(c)} onClick={() => toggle("concerns", c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium">年代（複数選択）</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGE_BANDS.map((a) => (
                <Chip key={a} selected={profile.ageBands.includes(a)} onClick={() => toggle("ageBands", a)}>
                  {a}
                </Chip>
              ))}
            </div>
          </fieldset>
          <Field label="価格帯" htmlFor="price">
            <select
              id="price"
              className={`${inputClass} sm:max-w-xs`}
              value={profile.priceBand}
              onChange={(e) => setProfile({ ...profile, priceBand: e.target.value })}
            >
              {PRICE_BANDS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      {error && (
        <div className="mb-4" role="alert">
          <Notice tone="danger">{error}</Notice>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit">保存する</Button>
      </div>
    </form>
  );
}
