import { createGeminiEngine } from "./gemini";
import { createOpenAIEngine } from "./openai";
import type { Engine } from "./types";

/**
 * 環境変数から、使えるAIを組み立てる（サーバー側でのみ使う）。
 * APIキーが無いAIは含めない。キーが1つも無ければ空配列＝診断は「準備中」になる。
 *
 * モデル名は環境変数で変更できる。既定値は各社の公式ドキュメント（2026-11-02 取得）の推奨・例に合わせた。
 * 本番で有効にする前に、料金ページで単価を確認すること。
 */
export const DEFAULT_OPENAI_MODEL = "gpt-5.5";
export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";

export function getConfiguredEngines(env: Record<string, string | undefined> = process.env): Engine[] {
  const engines: Engine[] = [];
  if (env.OPENAI_API_KEY) engines.push(createOpenAIEngine(env.OPENAI_API_KEY, env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL));
  if (env.GEMINI_API_KEY) engines.push(createGeminiEngine(env.GEMINI_API_KEY, env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL));
  return engines;
}
