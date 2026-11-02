import type { Profile } from "./types";

export const CATEGORIES = [
  "化粧水",
  "乳液",
  "美容液",
  "クリーム",
  "クレンジング",
  "洗顔料",
  "日焼け止め",
  "ファンデーション",
  "化粧下地",
  "リップ",
  "シャンプー",
  "ヘアトリートメント",
] as const;

export const CONCERNS = [
  "乾燥",
  "敏感肌",
  "毛穴",
  "ニキビができやすい",
  "ハリ不足",
  "くすみ",
  "テカリ",
  "日やけ",
  "小じわ（乾燥による）",
  "肌荒れ",
] as const;

export const AGE_BANDS = ["10代", "20代", "30代", "40代", "50代以上"] as const;

export const PRICE_BANDS = [
  "指定なし",
  "1,000円台まで",
  "2,000〜3,000円台",
  "4,000〜6,000円台",
  "7,000円以上",
] as const;

/**
 * 消費者がAIに聞きそうな質問のひな形。
 * {category} {concern} {age} {price} を置き換える。
 * 価格帯が「指定なし」のときは {price} を含むひな形を使わない。
 */
const TEMPLATES: { text: string; needs: ("concern" | "age" | "price")[] }[] = [
  { text: "{concern}におすすめの{category}を教えて", needs: ["concern"] },
  { text: "{age}の{concern}向けの{category}でおすすめは？", needs: ["age", "concern"] },
  { text: "{price}で買える、{concern}に合う{category}は？", needs: ["price", "concern"] },
  { text: "{age}におすすめの{category}ランキングを教えて", needs: ["age"] },
  { text: "{concern}で悩んでいます。ドラッグストアで買える{category}でいいものはありますか？", needs: ["concern"] },
  { text: "{concern}の人が{category}を選ぶときのポイントと、おすすめ商品を3つ教えて", needs: ["concern"] },
  { text: "{price}の{category}で人気のブランドは？", needs: ["price"] },
  { text: "デパコスとプチプラで、{concern}向けの{category}を比較して", needs: ["concern"] },
];

export function generateQuestions(profile: Profile, limit = 20): string[] {
  const category = profile.category || "化粧水";
  const concerns = profile.concerns.length ? profile.concerns : ["乾燥"];
  const ages = profile.ageBands.length ? profile.ageBands : ["20代"];
  const hasPrice = profile.priceBand && profile.priceBand !== "指定なし";

  // ひな形ごとに候補を作り、ひな形を順番に回して偏りなく並べる
  const perTemplate: string[][] = [];
  for (const t of TEMPLATES) {
    if (t.needs.includes("price") && !hasPrice) continue;
    const cs = t.needs.includes("concern") ? concerns : [""];
    const as = t.needs.includes("age") ? ages : [""];
    const list: string[] = [];
    for (const c of cs) {
      for (const a of as) {
        list.push(
          t.text
            .replaceAll("{category}", category)
            .replaceAll("{concern}", c.replace("（乾燥による）", ""))
            .replaceAll("{age}", a)
            .replaceAll("{price}", profile.priceBand),
        );
      }
    }
    perTemplate.push(list);
  }

  const out: string[] = [];
  const seen = new Set<string>();
  const longest = Math.max(0, ...perTemplate.map((l) => l.length));
  for (let i = 0; i < longest && out.length < limit; i++) {
    for (const list of perTemplate) {
      const s = list[i];
      if (s && !seen.has(s) && out.length < limit) {
        seen.add(s);
        out.push(s);
      }
    }
  }
  return out;
}
