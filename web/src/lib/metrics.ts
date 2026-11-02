import type { Brand, EngineId, Observation, Question } from "./types";

export interface BrandStat {
  brandId: string;
  name: string;
  isOwn: boolean;
  /** 言及された回答の数 */
  mentioned: number;
  /** 言及率（0〜1） */
  mentionRate: number;
  /** 言及された回答での平均順位（言及なしなら null） */
  avgRank: number | null;
  /** 最初に挙げられた回答の割合（0〜1） */
  firstRate: number;
  /** 全言及のうち、このブランドが占める割合（0〜1） */
  shareOfVoice: number;
}

export interface QuestionStat {
  questionId: string;
  text: string;
  answers: number;
  ownMentioned: number;
  /** 自社が出なかったのに競合が出た回答の数 */
  gapAnswers: number;
  topCompetitors: { brandId: string; name: string; count: number }[];
}

export interface Report {
  totalAnswers: number;
  brandStats: BrandStat[];
  byEngine: { engine: EngineId; answers: number; ownRate: number }[];
  questionStats: QuestionStat[];
  weekly: { weekStart: string; answers: number; ownRate: number }[];
}

function round(n: number, digits = 3): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/** その日を含む週の月曜日（ローカル日付, YYYY-MM-DD） */
export function weekStartOf(iso: string): string {
  const d = new Date(iso);
  const day = (d.getDay() + 6) % 7; // 月曜=0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * 記録した回答から指標を計算する（決定論的処理）。
 * 割合はすべて「記録した回答数」を分母にする。
 */
export function computeReport(
  observations: Observation[],
  brands: Brand[],
  questions: Question[],
): Report {
  const total = observations.length;
  const own = brands.find((b) => b.isOwn);
  const brandName = new Map(brands.map((b) => [b.id, b.name]));
  const totalMentions = observations.reduce((s, o) => s + o.mentions.length, 0);

  const brandStats: BrandStat[] = brands.map((b) => {
    const ranks: number[] = [];
    let first = 0;
    for (const o of observations) {
      const m = o.mentions.find((x) => x.brandId === b.id);
      if (m) {
        ranks.push(m.rank);
        if (m.rank === 1) first++;
      }
    }
    return {
      brandId: b.id,
      name: b.name,
      isOwn: b.isOwn,
      mentioned: ranks.length,
      mentionRate: total ? round(ranks.length / total) : 0,
      avgRank: ranks.length ? round(ranks.reduce((s, r) => s + r, 0) / ranks.length, 2) : null,
      firstRate: total ? round(first / total) : 0,
      shareOfVoice: totalMentions ? round(ranks.length / totalMentions) : 0,
    };
  });
  brandStats.sort((a, b) => b.mentionRate - a.mentionRate || Number(b.isOwn) - Number(a.isOwn));

  const ownMentioned = (o: Observation) => !!own && o.mentions.some((m) => m.brandId === own.id);

  const engineMap = new Map<EngineId, { answers: number; own: number }>();
  for (const o of observations) {
    const e = engineMap.get(o.engine) ?? { answers: 0, own: 0 };
    e.answers++;
    if (ownMentioned(o)) e.own++;
    engineMap.set(o.engine, e);
  }
  const byEngine = [...engineMap.entries()].map(([engine, v]) => ({
    engine,
    answers: v.answers,
    ownRate: round(v.own / v.answers),
  }));

  const questionStats: QuestionStat[] = questions
    .map((q) => {
      const obs = observations.filter((o) => o.questionId === q.id);
      const counts = new Map<string, number>();
      let ownCount = 0;
      let gap = 0;
      for (const o of obs) {
        const hasOwn = ownMentioned(o);
        if (hasOwn) ownCount++;
        const competitors = o.mentions.filter((m) => m.brandId !== own?.id);
        if (!hasOwn && competitors.length > 0) gap++;
        for (const m of competitors) counts.set(m.brandId, (counts.get(m.brandId) ?? 0) + 1);
      }
      return {
        questionId: q.id,
        text: q.text,
        answers: obs.length,
        ownMentioned: ownCount,
        gapAnswers: gap,
        topCompetitors: [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([brandId, count]) => ({ brandId, name: brandName.get(brandId) ?? "", count })),
      };
    })
    .filter((q) => q.answers > 0);

  const weekMap = new Map<string, { answers: number; own: number }>();
  for (const o of observations) {
    const w = weekStartOf(o.createdAt);
    const v = weekMap.get(w) ?? { answers: 0, own: 0 };
    v.answers++;
    if (ownMentioned(o)) v.own++;
    weekMap.set(w, v);
  }
  const weekly = [...weekMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, v]) => ({ weekStart, answers: v.answers, ownRate: round(v.own / v.answers) }));

  return { totalAnswers: total, brandStats, byEngine, questionStats, weekly };
}
