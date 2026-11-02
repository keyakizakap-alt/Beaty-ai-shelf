import { callJson, EngineError, uniqueCitations, type Citation, type Engine, type EngineAnswer, type FetchLike } from "./types";

/**
 * OpenAI Responses API + web_search ツール。
 * 仕様確認：https://developers.openai.com/api/docs/guides/tools-web-search（2026-11-02 取得・公式）
 *   POST https://api.openai.com/v1/responses
 *   body: { model, input, tools: [{ type: "web_search", user_location }] }
 *   回答：output[] の type="message" → content[] の type="output_text" → text / annotations(url_citation)
 */
export const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";

export function buildOpenAIRequest(model: string, question: string) {
  return {
    model,
    input: question,
    tools: [{ type: "web_search", user_location: { type: "approximate", country: "JP" } }],
  };
}

interface OAContent {
  type?: string;
  text?: string;
  annotations?: { type?: string; url?: string; title?: string }[];
}
interface OAOutput {
  type?: string;
  content?: OAContent[];
}

export function parseOpenAIResponse(json: unknown): EngineAnswer {
  const output = (json as { output?: OAOutput[] } | null)?.output;
  if (!Array.isArray(output)) throw new EngineError("bad_response", "OpenAI: 応答の形式が想定と異なります");
  const texts: string[] = [];
  const citations: Citation[] = [];
  for (const item of output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) continue;
    for (const c of item.content) {
      if (c?.type !== "output_text" || typeof c.text !== "string") continue;
      texts.push(c.text);
      for (const a of c.annotations ?? []) {
        if (a?.type === "url_citation" && typeof a.url === "string") citations.push({ url: a.url, title: a.title ?? "" });
      }
    }
  }
  const text = texts.join("\n").trim();
  if (!text) throw new EngineError("bad_response", "OpenAI: 回答の本文がありません");
  return { text, citations: uniqueCitations(citations) };
}

export function createOpenAIEngine(apiKey: string, model: string, fetchFn: FetchLike = fetch): Engine {
  return {
    id: "chatgpt",
    label: "ChatGPT",
    async ask(question, signal) {
      const json = await callJson(
        fetchFn,
        OPENAI_ENDPOINT,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(buildOpenAIRequest(model, question)),
          signal,
        },
        "OpenAI",
      );
      return parseOpenAIResponse(json);
    },
  };
}
