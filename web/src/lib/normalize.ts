/**
 * ブランド名照合用の正規化。
 * - NFKC（全角英数→半角、半角カナ→全角カナ。半角の濁点・半濁点も結合する）
 * - 小文字化
 * - ひらがな→カタカナ
 * - 空白・中点・長音・ハイフン類・記号の除去
 *
 * 元テキストの位置へ戻せるよう、正規化後の各文字が元テキストの何文字目に由来するかも返す。
 */
const REMOVABLE =
  /[\s・･\-‐‑‒–—―ー－_.'’`´"“”!！?？,，、。:：;；/／()（）［］[\]【】「」『』〈〉《》&＆+＋™®©*＊#＃|｜~〜]/u;

const HALF_WIDTH_VOICED = /[ﾞﾟ]/;

function toKatakana(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= 0x3041 && code <= 0x3096) return String.fromCharCode(code + 0x60);
  return ch;
}

export interface Normalized {
  text: string;
  /** map[i] = 正規化後 i 文字目の、元テキストでの位置 */
  map: number[];
}

export function normalizeWithMap(input: string): Normalized {
  let text = "";
  const map: number[] = [];
  let i = 0;
  while (i < input.length) {
    let unit = input[i];
    let width = 1;
    // サロゲートペア
    const code = input.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < input.length) {
      unit += input[i + 1];
      width = 2;
    }
    // 半角カナ + 半角濁点/半濁点
    if (i + width < input.length && HALF_WIDTH_VOICED.test(input[i + width])) {
      unit += input[i + width];
      width += 1;
    }
    const nf = unit.normalize("NFKC").toLowerCase();
    for (const raw of nf) {
      if (REMOVABLE.test(raw)) continue;
      text += toKatakana(raw);
      map.push(i);
    }
    i += width;
  }
  return { text, map };
}

export function normalize(input: string): string {
  return normalizeWithMap(input).text;
}

export function isAsciiAlnum(s: string): boolean {
  return /^[a-z0-9]+$/.test(s);
}
