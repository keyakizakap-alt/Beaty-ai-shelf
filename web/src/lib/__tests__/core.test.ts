import { describe, expect, it } from "vitest";
import { detectMentions } from "../detect";
import { computeReport, weekStartOf } from "../metrics";
import { normalize } from "../normalize";
import { generateQuestions } from "../questions";
import { parseWorkspace } from "../storage";
import type { Brand, Observation, Question } from "../types";
import { checkText } from "../yakki";

const brands: Brand[] = [
  { id: "own", name: "ミナモ", aliases: ["MINAMO", "みなも"], isOwn: true },
  { id: "a", name: "ルーセント", aliases: ["LUCENT"], isOwn: false },
  { id: "sk2", name: "SK-II", aliases: ["エスケーツー"], isOwn: false },
  { id: "sk", name: "SK", aliases: [], isOwn: false },
];

describe("normalize", () => {
  it("全角・半角・ひらがな・記号の違いを吸収する", () => {
    expect(normalize("ＭＩＮＡＭＯ")).toBe("minamo");
    expect(normalize("みなも")).toBe(normalize("ミナモ"));
    expect(normalize("ﾐﾅﾓ")).toBe("ミナモ");
    expect(normalize("ｶﾞｰﾄﾞ")).toBe(normalize("ガード"));
    expect(normalize("SK-II")).toBe("skii");
    expect(normalize("ラ・ロッシュ ポゼ")).toBe(normalize("ラロッシュポゼ"));
  });
});

describe("detectMentions", () => {
  it("登場順に順位をつける", () => {
    const m = detectMentions("おすすめはルーセント、次にミナモです。", brands);
    expect(m.map((x) => x.brandId)).toEqual(["a", "own"]);
    expect(m.map((x) => x.rank)).toEqual([1, 2]);
  });

  it("別名・表記ゆれで検出し、同じブランドは1回だけ数える", () => {
    const m = detectMentions("MINAMOの化粧水。みなもは保湿力が高い。ＭＩＮＡＭＯ", brands);
    expect(m).toHaveLength(1);
    expect(m[0].brandId).toBe("own");
    expect(m[0].index).toBe(0);
  });

  it("英字の別名は単語の一部には一致しない", () => {
    const m = detectMentions("SKINCAREの基本はASKすること", brands);
    expect(m).toHaveLength(0);
  });

  it("重なる一致は長い方（SK-II）を優先する", () => {
    const m = detectMentions("SK-IIのフェイシャルトリートメント", brands);
    expect(m.map((x) => x.brandId)).toEqual(["sk2"]);
  });

  it("言及がなければ空", () => {
    expect(detectMentions("特定のブランドは挙げられません。", brands)).toEqual([]);
  });

  it("1文字の別名は使わない", () => {
    const b: Brand[] = [{ id: "x", name: "A", aliases: ["あ"], isOwn: false }];
    expect(detectMentions("A あ A", b)).toEqual([]);
  });
});

describe("computeReport", () => {
  const questions: Question[] = [
    { id: "q1", text: "乾燥におすすめの化粧水は？", generated: true },
    { id: "q2", text: "敏感肌の化粧水は？", generated: true },
  ];
  const mk = (id: string, q: string, text: string, engine: Observation["engine"] = "chatgpt"): Observation => ({
    id,
    questionId: q,
    engine,
    answerText: text,
    createdAt: "2026-11-02T10:00:00.000Z",
    mentions: detectMentions(text, brands),
  });
  const obs = [
    mk("1", "q1", "ミナモとルーセント"),
    mk("2", "q1", "ルーセントのみ", "gemini"),
    mk("3", "q2", "ルーセント、ミナモ"),
    mk("4", "q2", "該当なし", "gemini"),
  ];
  const r = computeReport(obs, brands, questions);

  it("言及率・平均順位・1位率を計算する", () => {
    const own = r.brandStats.find((b) => b.brandId === "own")!;
    expect(own.mentionRate).toBe(0.5);
    expect(own.avgRank).toBe(1.5);
    expect(own.firstRate).toBe(0.25);
    const a = r.brandStats.find((b) => b.brandId === "a")!;
    expect(a.mentionRate).toBe(0.75);
    expect(a.shareOfVoice).toBe(0.6);
  });

  it("AIごとの自社言及率を計算する", () => {
    expect(r.byEngine.find((e) => e.engine === "chatgpt")?.ownRate).toBe(1);
    expect(r.byEngine.find((e) => e.engine === "gemini")?.ownRate).toBe(0);
  });

  it("自社が出ず競合が出た回答をギャップとして数える", () => {
    const q1 = r.questionStats.find((q) => q.questionId === "q1")!;
    expect(q1.gapAnswers).toBe(1);
    expect(q1.topCompetitors[0].brandId).toBe("a");
    const q2 = r.questionStats.find((q) => q.questionId === "q2")!;
    expect(q2.gapAnswers).toBe(0);
  });

  it("記録がゼロでも壊れない", () => {
    const empty = computeReport([], brands, questions);
    expect(empty.totalAnswers).toBe(0);
    expect(empty.brandStats.every((b) => b.mentionRate === 0)).toBe(true);
  });

  it("週の開始日は月曜日", () => {
    expect(weekStartOf("2026-11-04T12:00:00")).toBe("2026-11-02");
    expect(weekStartOf("2026-11-08T12:00:00")).toBe("2026-11-02");
  });
});

describe("generateQuestions", () => {
  it("カテゴリと悩みを含む質問を、重複なく上限まで作る", () => {
    const qs = generateQuestions(
      { category: "美容液", concerns: ["乾燥", "毛穴"], ageBands: ["30代"], priceBand: "指定なし" },
      10,
    );
    expect(qs.length).toBeLessThanOrEqual(10);
    expect(new Set(qs).size).toBe(qs.length);
    expect(qs.every((q) => q.includes("美容液"))).toBe(true);
    expect(qs.some((q) => q.includes("{"))).toBe(false);
  });

  it("価格帯が指定なしなら価格の質問を作らない", () => {
    const qs = generateQuestions({ category: "化粧水", concerns: ["乾燥"], ageBands: ["20代"], priceBand: "指定なし" });
    expect(qs.some((q) => q.includes("指定なし"))).toBe(false);
  });
});

describe("checkText（薬機法の一次チェック）", () => {
  const ids = (t: string, p: "cosmetic" | "quasi_drug" = "cosmetic") => checkText(t, p).map((f) => f.ruleId);

  it("医薬品的な表現を検出する", () => {
    expect(ids("使い続けると肌荒れが治る")).toContain("medical");
    expect(ids("シミが消える美容液")).toContain("spots");
    expect(ids("シワを解消")).toContain("wrinkle");
    expect(ids("アンチエイジングに")).toContain("aging");
    expect(ids("皮膚科医も推薦")).toContain("doctor");
    expect(ids("副作用なしで安心")).toContain("safety");
    expect(ids("業界No.1の保湿力")).toContain("superlative");
    expect(ids("たった1週間で実感")).toContain("instant");
  });

  it("56項目の範囲の表現は検出しない", () => {
    expect(ids("肌荒れを防ぐ。肌にはりを与える。皮膚の乾燥を防ぐ。")).toEqual([]);
    expect(ids("乾燥による小じわを目立たなくする")).toEqual([]);
    expect(ids("日やけによるシミ、ソバカスを防ぐ")).toEqual([]);
    expect(ids("洗浄によりニキビを防ぐ")).toEqual([]);
    expect(ids("角質層まで浸透")).toEqual([]);
  });

  it("医薬部外品では承認効能の範囲になりうる表現を「参考」に下げる", () => {
    const f = checkText("メラニンの生成を抑え、シミを防ぐ美白", "quasi_drug");
    expect(f.length).toBeGreaterThan(0);
    expect(f.every((x) => x.severity === "low" && x.conditional)).toBe(true);
  });

  it("検出位置が元テキストと一致する", () => {
    const t = "この美容液でシミが消える";
    const f = checkText(t)[0];
    expect(t.slice(f.start, f.end)).toBe(f.text);
  });
});

describe("parseWorkspace", () => {
  it("不正なデータを拒否する", () => {
    expect(parseWorkspace(null).ok).toBe(false);
    expect(parseWorkspace({ version: 2 }).ok).toBe(false);
    expect(
      parseWorkspace({
        version: 1,
        brands: [{ id: "1", name: "x", aliases: [], isOwn: "yes" }],
        profile: {},
        questions: [],
        observations: [],
      }).ok,
    ).toBe(false);
  });

  it("言及は保存値を使わずに再計算する", () => {
    const res = parseWorkspace({
      version: 1,
      brands,
      profile: { category: "化粧水", concerns: [], ageBands: [], priceBand: "指定なし" },
      questions: [{ id: "q", text: "t", generated: false }],
      observations: [
        {
          id: "o",
          questionId: "q",
          engine: "chatgpt",
          answerText: "ミナモ",
          createdAt: "2026-11-02T00:00:00.000Z",
          mentions: [{ brandId: "a", rank: 1, index: 0, matched: "改ざん" }],
        },
      ],
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.observations[0].mentions[0].brandId).toBe("own");
  });
});
