import { callJson, EngineError, uniqueCitations, type Citation, type Engine, type EngineAnswer, type FetchLike } from "./types";

/**
 * Gemini Interactions API + google_search ツール。
 * 仕様確認：https://ai.google.dev/gemini-api/docs/google-search（2026-11-02 取得・公式）
 *   POST https://generativelanguage.googleapis.com/v1beta/interactions
 *   header: x-goog-api-key
 *   body: { model, input, tools: [{ type: "google_search" }] }
 *   回答：steps[] の type="model_output" → content[] の type="text" → text / annotations(url_citation)
 * 注意：Google検索グラウンディングは有料枠のみ（無料枠では使えない）。
 */
export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

export function buildGeminiRequest(model: string, question: string) {
  return { model, input: question, tools: [{ type: "google_search" }] };
}

interface GContent {
  type?: string;
  text?: string;
  annotations?: { type?: string; url?: string; title?: string }[];
}
interface GStep {
  type?: string;
  content?: GContent[];
}

export function parseGeminiInteraction(json: unknown): EngineAnswer {
  const steps = (json as { steps?: GStep[] } | null)?.steps;
  if (!Array.isArray(steps)) throw new EngineError("bad_response", "Gemini: 応答の形式が想定と異なります");
  const texts: string[] = [];
  const citations: Citation[] = [];
  for (const step of steps) {
    if (step?.type !== "model_output" || !Array.isArray(step.content)) continue;
    for (const c of step.content) {
      if (c?.type !== "text" || typeof c.text !== "string") continue;
      texts.push(c.text);
      for (const a of c.annotations ?? []) {
        if (a?.type === "url_citation" && typeof a.url === "string") citations.push({ url: a.url, title: a.title ?? "" });
      }
    }
  }
  const text = texts.join("\n").trim();
  if (!text) throw new EngineError("bad_response", "Gemini: 回答の本文がありません");
  return { text, citations: uniqueCitations(citations) };
}

export function createGeminiEngine(apiKey: string, model: string, fetchFn: FetchLike = fetch): Engine {
  return {
    id: "gemini",
    label: "Gemini",
    async ask(question, signal) {
      const json = await callJson(
        fetchFn,
        GEMINI_ENDPOINT,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify(buildGeminiRequest(model, question)),
          signal,
        },
        "Gemini",
      );
      return parseGeminiInteraction(json);
    },
  };
}
