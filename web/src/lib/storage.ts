import { detectMentions } from "./detect";
import type { Brand, EngineId, Observation, Profile, Question, Workspace } from "./types";

export const STORAGE_KEY = "beauty-ai-shelf:workspace:v1";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyWorkspace(): Workspace {
  return {
    version: 1,
    brands: [],
    profile: { category: "化粧水", concerns: ["乾燥"], ageBands: ["30代"], priceBand: "指定なし" },
    questions: [],
    observations: [],
    updatedAt: new Date().toISOString(),
  };
}

/** 読み込みを受け付ける件数の上限（画面の上限と同じ。巨大なファイルによる動作停止を防ぐ） */
export const LIMITS = { brands: 11, questions: 50, observations: 2000 };

const ENGINE_IDS: EngineId[] = ["chatgpt", "gemini", "claude", "perplexity", "other"];
const isStr = (v: unknown): v is string => typeof v === "string";
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

/** 読み込んだJSONを検証する。不正なら理由を返す */
export function parseWorkspace(raw: unknown): { ok: true; value: Workspace } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "データの形式が正しくありません。" };
  const w = raw as Record<string, unknown>;
  if (w.version !== 1) return { ok: false, error: "対応していないデータのバージョンです。" };

  if (!Array.isArray(w.brands)) return { ok: false, error: "ブランドの情報がありません。" };
  if (w.brands.length > LIMITS.brands) return { ok: false, error: "ブランドの数が多すぎます。" };
  if (Array.isArray(w.questions) && w.questions.length > LIMITS.questions) return { ok: false, error: "質問の数が多すぎます。" };
  if (Array.isArray(w.observations) && w.observations.length > LIMITS.observations) return { ok: false, error: "記録の数が多すぎます。" };
  const brands: Brand[] = [];
  for (const b of w.brands as Record<string, unknown>[]) {
    if (!b || !isStr(b.id) || !isStr(b.name) || !isStrArr(b.aliases) || typeof b.isOwn !== "boolean") {
      return { ok: false, error: "ブランドの情報に不正な値があります。" };
    }
    brands.push({ id: b.id, name: b.name.slice(0, 80), aliases: b.aliases.slice(0, 20), isOwn: b.isOwn });
  }
  if (brands.filter((b) => b.isOwn).length > 1) return { ok: false, error: "自社ブランドが複数あります。" };

  const p = w.profile as Record<string, unknown> | undefined;
  if (!p || !isStr(p.category) || !isStrArr(p.concerns) || !isStrArr(p.ageBands) || !isStr(p.priceBand)) {
    return { ok: false, error: "商品カテゴリなどの設定に不正な値があります。" };
  }
  const profile: Profile = {
    category: p.category,
    concerns: p.concerns,
    ageBands: p.ageBands,
    priceBand: p.priceBand,
  };

  if (!Array.isArray(w.questions)) return { ok: false, error: "質問の情報がありません。" };
  const questions: Question[] = [];
  for (const q of w.questions as Record<string, unknown>[]) {
    if (!q || !isStr(q.id) || !isStr(q.text) || typeof q.generated !== "boolean") {
      return { ok: false, error: "質問の情報に不正な値があります。" };
    }
    questions.push({ id: q.id, text: q.text.slice(0, 500), generated: q.generated });
  }

  if (!Array.isArray(w.observations)) return { ok: false, error: "記録の情報がありません。" };
  const observations: Observation[] = [];
  for (const o of w.observations as Record<string, unknown>[]) {
    if (
      !o ||
      !isStr(o.id) ||
      !isStr(o.questionId) ||
      !isStr(o.answerText) ||
      !isStr(o.createdAt) ||
      !ENGINE_IDS.includes(o.engine as EngineId) ||
      Number.isNaN(Date.parse(o.createdAt))
    ) {
      return { ok: false, error: "記録の情報に不正な値があります。" };
    }
    // 言及は保存値を信用せず、ブランド設定から再計算する
    observations.push({
      id: o.id,
      questionId: o.questionId,
      engine: o.engine as EngineId,
      answerText: o.answerText.slice(0, 20000),
      createdAt: o.createdAt,
      mentions: detectMentions(o.answerText, brands),
    });
  }

  return {
    ok: true,
    value: {
      version: 1,
      brands,
      profile,
      questions,
      observations,
      updatedAt: isStr(w.updatedAt) ? w.updatedAt : new Date().toISOString(),
      sample: w.sample === true,
    },
  };
}

/** ブランド設定を変えたときに、全記録の言及を再計算する */
export function recomputeMentions(ws: Workspace): Workspace {
  return {
    ...ws,
    observations: ws.observations.map((o) => ({ ...o, mentions: detectMentions(o.answerText, ws.brands) })),
  };
}

export function loadWorkspace(): Workspace | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseWorkspace(JSON.parse(raw));
    return parsed.ok ? parsed.value : null;
  } catch {
    return null;
  }
}

export function saveWorkspace(ws: Workspace): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...ws, updatedAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function clearWorkspace(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 何もしない
  }
}
