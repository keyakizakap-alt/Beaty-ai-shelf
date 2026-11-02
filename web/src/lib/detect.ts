import { isAsciiAlnum, normalize, normalizeWithMap } from "./normalize";
import type { Brand, Mention } from "./types";

/** 照合に使う最短の文字数（正規化後）。1文字の別名は誤検出が多いため使わない */
export const MIN_ALIAS_LENGTH = 2;

interface Candidate {
  brandId: string;
  start: number; // 正規化テキスト上の位置
  end: number; // exclusive
  origIndex: number;
  matched: string;
}

function brandTerms(brand: Brand): string[] {
  const terms = new Set<string>();
  for (const t of [brand.name, ...brand.aliases]) {
    const n = normalize(t);
    if (n.length >= MIN_ALIAS_LENGTH) terms.add(n);
  }
  return [...terms];
}

/**
 * 回答テキストからブランドの言及を検出する（LLMを使わない決定論的処理）。
 * - 表記ゆれは正規化と別名で吸収する
 * - 英数字だけの別名は、元テキスト上で前後が英数字でない場合のみ一致とする（"SK" が "SKIN" に一致しないように）
 * - 重なる一致は長い方を優先する（"SK-II" と "SK" など）
 * - 順位は各ブランドが最初に登場した順
 */
export function detectMentions(answer: string, brands: Brand[]): Mention[] {
  const { text, map } = normalizeWithMap(answer);
  const candidates: Candidate[] = [];

  for (const brand of brands) {
    for (const term of brandTerms(brand)) {
      let from = 0;
      while (from <= text.length - term.length) {
        const pos = text.indexOf(term, from);
        if (pos === -1) break;
        const end = pos + term.length;
        const origStart = map[pos];
        const origEndChar = map[end - 1];
        let ok = true;
        if (isAsciiAlnum(term)) {
          const before = origStart > 0 ? answer[origStart - 1] : "";
          const after = origEndChar + 1 < answer.length ? answer[origEndChar + 1] : "";
          const isAlnum = (c: string) => /[a-z0-9]/i.test(c.normalize("NFKC"));
          if ((before && isAlnum(before)) || (after && isAlnum(after))) ok = false;
        }
        if (ok) {
          candidates.push({
            brandId: brand.id,
            start: pos,
            end,
            origIndex: origStart,
            matched: answer.slice(origStart, origEndChar + 1),
          });
        }
        from = pos + 1;
      }
    }
  }

  // 長い一致を優先して、重なりを除去
  candidates.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken: Candidate[] = [];
  for (const c of candidates) {
    if (taken.some((t) => c.start < t.end && t.start < c.end)) continue;
    taken.push(c);
  }

  // ブランドごとに最初の出現
  const first = new Map<string, Candidate>();
  for (const c of taken) {
    const prev = first.get(c.brandId);
    if (!prev || c.start < prev.start) first.set(c.brandId, c);
  }

  return [...first.values()]
    .sort((a, b) => a.start - b.start)
    .map((c, i) => ({ brandId: c.brandId, rank: i + 1, index: c.origIndex, matched: c.matched }));
}
