import { detectMentions } from "./detect";
import { EngineError, type Citation, type Engine } from "./engines/types";
import { computeReport } from "./metrics";
import { CATEGORIES, CONCERNS, generateQuestions } from "./questions";
import type { Brand, EngineId, Observation, Question } from "./types";

export interface DiagnosisInput {
  brand: string;
  aliases: string[];
  competitors: string[];
  category: string;
  concern: string;
}

export const DIAGNOSIS_LIMITS = {
  brandMax: 60,
  aliasesMax: 5,
  competitorsMax: 5,
};

/** 外部からの入力を検証・整形する（失敗時はエラーメッセージ） */
export function validateDiagnosisInput(raw: unknown): { ok: true; value: DiagnosisInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "入力の形式が正しくありません。" };
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim() : "");
  const list = (v: unknown, max: number) =>
    (Array.isArray(v) ? v : typeof v === "string" ? v.split(/[、,，\n]/) : [])
      .map(str)
      .filter(Boolean)
      .slice(0, max);

  const brand = str(r.brand);
  if (!brand) return { ok: false, error: "ブランド名を入力してください。" };
  if (brand.length > DIAGNOSIS_LIMITS.brandMax) return { ok: false, error: `ブランド名は${DIAGNOSIS_LIMITS.brandMax}文字以内で入力してください。` };
  const category = str(r.category);
  if (!(CATEGORIES as readonly string[]).includes(category)) return { ok: false, error: "カテゴリを選んでください。" };
  const concern = str(r.concern);
  if (!(CONCERNS as readonly string[]).includes(concern)) return { ok: false, error: "悩みを選んでください。" };
  const aliases = list(r.aliases, DIAGNOSIS_LIMITS.aliasesMax).map((s) => s.slice(0, DIAGNOSIS_LIMITS.brandMax));
  const competitors = list(r.competitors, DIAGNOSIS_LIMITS.competitorsMax)
    .map((s) => s.slice(0, DIAGNOSIS_LIMITS.brandMax))
    .filter((c) => c.toLowerCase() !== brand.toLowerCase());
  return { ok: true, value: { brand, aliases, competitors: [...new Set(competitors)], category, concern } };
}

export interface DiagnosisAnswer {
  questionId: string;
  engine: EngineId;
  ownRank: number | null;
  mentionedBrands: string[];
  excerpt: string;
  citations: Citation[];
}

export interface DiagnosisResult {
  brand: string;
  questions: Question[];
  engines: { id: EngineId; label: string; answered: number; failed: number; ownRate: number }[];
  ownRate: number;
  ownAvgRank: number | null;
  competitors: { name: string; rate: number }[];
  answers: DiagnosisAnswer[];
  topDomains: { domain: string; count: number }[];
  /** 失敗した呼び出しの数（エラー種別ごと） */
  failures: Partial<Record<string, number>>;
  measuredAt: string;
}

/** 同時実行数を制限して非同期処理を並べる */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

function domainOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * 無料診断：質問を作り、各AIに聞き、ブランドの登場を決定論的に数える。
 * AIの回答そのものの解釈（ブランド抽出）にはLLMを使わない。
 */
export async function runDiagnosis(
  input: DiagnosisInput,
  engines: Engine[],
  opts: { questionCount?: number; concurrency?: number; timeoutMs?: number; now?: () => Date } = {},
): Promise<DiagnosisResult> {
  const { questionCount = 6, concurrency = 6, timeoutMs = 45_000, now = () => new Date() } = opts;
  const questions: Question[] = generateQuestions(
    { category: input.category, concerns: [input.concern], ageBands: ["20代", "30代", "40代"], priceBand: "指定なし" },
    questionCount,
  ).map((text, i) => ({ id: `q${i + 1}`, text, generated: true }));

  const brands: Brand[] = [
    { id: "own", name: input.brand, aliases: input.aliases, isOwn: true },
    ...input.competitors.map((name, i) => ({ id: `c${i + 1}`, name, aliases: [], isOwn: false })),
  ];

  const jobs = engines.flatMap((engine) => questions.map((q) => ({ engine, q })));
  const failures: Record<string, number> = {};
  const results = await mapLimit(jobs, concurrency, async ({ engine, q }) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const answer = await engine.ask(q.text, ctrl.signal);
      return { engine, q, answer };
    } catch (e) {
      const kind = e instanceof EngineError ? e.kind : "unknown";
      failures[kind] = (failures[kind] ?? 0) + 1;
      return { engine, q, answer: null };
    } finally {
      clearTimeout(timer);
    }
  });

  const measuredAt = now().toISOString();
  const observations: Observation[] = [];
  const answers: DiagnosisAnswer[] = [];
  const domainCount = new Map<string, number>();
  const nameOf = new Map(brands.map((b) => [b.id, b.name]));

  for (const r of results) {
    if (!r.answer) continue;
    const mentions = detectMentions(r.answer.text, brands);
    observations.push({
      id: `${r.engine.id}-${r.q.id}`,
      questionId: r.q.id,
      engine: r.engine.id,
      answerText: r.answer.text,
      createdAt: measuredAt,
      mentions,
    });
    answers.push({
      questionId: r.q.id,
      engine: r.engine.id,
      ownRank: mentions.find((m) => m.brandId === "own")?.rank ?? null,
      mentionedBrands: mentions.map((m) => nameOf.get(m.brandId) ?? ""),
      excerpt: r.answer.text.slice(0, 600),
      citations: r.answer.citations.slice(0, 5),
    });
    for (const c of r.answer.citations) {
      const d = domainOf(c.url);
      if (d) domainCount.set(d, (domainCount.get(d) ?? 0) + 1);
    }
  }

  const report = computeReport(observations, brands, questions);
  const own = report.brandStats.find((b) => b.isOwn)!;

  return {
    brand: input.brand,
    questions,
    engines: engines.map((e) => {
      const mine = results.filter((r) => r.engine.id === e.id);
      const answered = mine.filter((r) => r.answer).length;
      return {
        id: e.id,
        label: e.label,
        answered,
        failed: mine.length - answered,
        ownRate: report.byEngine.find((b) => b.engine === e.id)?.ownRate ?? 0,
      };
    }),
    ownRate: own.mentionRate,
    ownAvgRank: own.avgRank,
    competitors: report.brandStats.filter((b) => !b.isOwn).map((b) => ({ name: b.name, rate: b.mentionRate })),
    answers,
    topDomains: [...domainCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([domain, count]) => ({ domain, count })),
    failures,
    measuredAt,
  };
}
