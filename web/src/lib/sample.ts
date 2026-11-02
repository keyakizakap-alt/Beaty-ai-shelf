import { detectMentions } from "./detect";
import { generateQuestions } from "./questions";
import { newId } from "./storage";
import type { Brand, EngineId, Observation, Workspace } from "./types";

/**
 * 画面の使い方を確かめるための「サンプルデータ」。
 * 架空のブランド名を使い、実在ブランドの評価と誤解されないようにしている。
 * 画面上では常に「サンプル」と表示する。
 */
export function sampleWorkspace(): Workspace {
  const brands: Brand[] = [
    { id: newId(), name: "ミナモ", aliases: ["MINAMO", "みなも"], isOwn: true },
    { id: newId(), name: "ルーセント", aliases: ["LUCENT"], isOwn: false },
    { id: newId(), name: "アオバ製薬", aliases: ["アオバ", "AOBA"], isOwn: false },
    { id: newId(), name: "ハクレン", aliases: ["HAKUREN"], isOwn: false },
  ];
  const profile = { category: "化粧水", concerns: ["乾燥", "敏感肌"], ageBands: ["30代"], priceBand: "2,000〜3,000円台" };
  const questions = generateQuestions(profile, 6).map((text) => ({ id: newId(), text, generated: true }));

  const answers: { q: number; engine: EngineId; text: string; daysAgo: number }[] = [
    { q: 0, engine: "chatgpt", daysAgo: 9, text: "乾燥が気になる方には、ルーセントのモイストローション、アオバ製薬の高保湿化粧水がよく挙げられます。" },
    { q: 0, engine: "gemini", daysAgo: 9, text: "おすすめは1. アオバ製薬 しっとり化粧水 2. ハクレン 保湿ミスト 3. ミナモ うるおいローション です。" },
    { q: 1, engine: "chatgpt", daysAgo: 8, text: "30代の敏感肌には、低刺激処方のミナモ（MINAMO）や、ルーセントの敏感肌ラインが候補です。" },
    { q: 1, engine: "gemini", daysAgo: 8, text: "敏感肌向けならアオバの化粧水が人気です。ルーセントも選ばれています。" },
    { q: 2, engine: "chatgpt", daysAgo: 2, text: "2,000〜3,000円台なら、みなものローションとハクレンが価格と保湿力のバランスで評価されています。" },
    { q: 2, engine: "gemini", daysAgo: 2, text: "この価格帯ではルーセント、アオバ製薬、ハクレンが定番です。" },
    { q: 3, engine: "chatgpt", daysAgo: 1, text: "30代向けのランキングでは、1位 ミナモ、2位 ルーセント、3位 アオバ製薬 という結果がよく見られます。" },
  ];

  const now = Date.now();
  const observations: Observation[] = answers.map((a) => ({
    id: newId(),
    questionId: questions[a.q].id,
    engine: a.engine,
    answerText: a.text,
    createdAt: new Date(now - a.daysAgo * 86400000).toISOString(),
    mentions: detectMentions(a.text, brands),
  }));

  return { version: 1, brands, profile, questions, observations, updatedAt: new Date().toISOString(), sample: true };
}
