import { describe, expect, it, vi } from "vitest";
import { runDiagnosis, validateDiagnosisInput } from "../diagnosis";
import { createGeminiEngine, buildGeminiRequest, parseGeminiInteraction } from "../engines/gemini";
import { buildOpenAIRequest, createOpenAIEngine, parseOpenAIResponse } from "../engines/openai";
import { getConfiguredEngines } from "../engines/registry";
import { EngineError, type Engine } from "../engines/types";
import { RateLimiter } from "../rate-limit";

const openaiFixture = {
  output: [
    { type: "web_search_call", status: "completed", action: { type: "search", query: "乾燥 化粧水" } },
    {
      type: "message",
      role: "assistant",
      content: [
        {
          type: "output_text",
          text: "おすすめはルーセントとミナモです。",
          annotations: [
            { type: "url_citation", start_index: 0, end_index: 5, url: "https://www.example.com/a", title: "A" },
            { type: "url_citation", start_index: 6, end_index: 9, url: "https://www.example.com/a", title: "A" },
          ],
        },
      ],
    },
  ],
};

const geminiFixture = {
  steps: [
    { type: "google_search_call", arguments: { queries: ["乾燥 化粧水"] } },
    {
      type: "model_output",
      content: [{ type: "text", text: "ミナモが人気です。", annotations: [{ type: "url_citation", url: "https://cosme.example.jp/x", title: "X" }] }],
    },
  ],
};

function okResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

describe("OpenAI アダプタ", () => {
  it("公式ドキュメントどおりのリクエストを作る", () => {
    const r = buildOpenAIRequest("gpt-5.5", "質問");
    expect(r.tools[0].type).toBe("web_search");
    expect(r.tools[0].user_location.country).toBe("JP");
    expect(r.input).toBe("質問");
  });

  it("本文と引用URL（重複なし）を取り出す", () => {
    const a = parseOpenAIResponse(openaiFixture);
    expect(a.text).toBe("おすすめはルーセントとミナモです。");
    expect(a.citations).toEqual([{ url: "https://www.example.com/a", title: "A" }]);
  });

  it("想定外の形式はエラーにする", () => {
    expect(() => parseOpenAIResponse({})).toThrow(EngineError);
    expect(() => parseOpenAIResponse({ output: [] })).toThrow(EngineError);
  });

  it("APIキーをAuthorizationヘッダーで送り、HTTPエラーを種別に変換する", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(okResponse(openaiFixture)).mockResolvedValueOnce(new Response("", { status: 429 }));
    const e = createOpenAIEngine("sk-test", "gpt-5.5", fetchFn);
    await e.ask("q", new AbortController().signal);
    const init = fetchFn.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sk-test");
    await expect(e.ask("q", new AbortController().signal)).rejects.toMatchObject({ kind: "rate_limit" });
  });
});

describe("Gemini アダプタ", () => {
  it("google_search ツールつきのリクエストを作る", () => {
    expect(buildGeminiRequest("gemini-3.8-flash", "q").tools).toEqual([{ type: "google_search" }]);
  });

  it("本文と引用URLを取り出す", () => {
    const a = parseGeminiInteraction(geminiFixture);
    expect(a.text).toBe("ミナモが人気です。");
    expect(a.citations[0].url).toBe("https://cosme.example.jp/x");
  });

  it("キーは x-goog-api-key ヘッダーで送る。通信失敗は network エラー", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(okResponse(geminiFixture)).mockRejectedValueOnce(new TypeError("fail"));
    const e = createGeminiEngine("g-key", "gemini-3.8-flash", fetchFn);
    await e.ask("q", new AbortController().signal);
    expect((fetchFn.mock.calls[0][1].headers as Record<string, string>)["x-goog-api-key"]).toBe("g-key");
    await expect(e.ask("q", new AbortController().signal)).rejects.toMatchObject({ kind: "network" });
  });

  it("401 は認証エラー", async () => {
    const e = createGeminiEngine("bad", "m", vi.fn().mockResolvedValue(new Response("", { status: 401 })));
    await expect(e.ask("q", new AbortController().signal)).rejects.toMatchObject({ kind: "auth" });
  });
});

describe("getConfiguredEngines", () => {
  it("キーが無ければ空（＝診断は準備中）", () => {
    expect(getConfiguredEngines({})).toEqual([]);
  });
  it("キーがあるAIだけを使う", () => {
    expect(getConfiguredEngines({ GEMINI_API_KEY: "x" }).map((e) => e.id)).toEqual(["gemini"]);
    expect(getConfiguredEngines({ OPENAI_API_KEY: "x", GEMINI_API_KEY: "y" }).map((e) => e.id)).toEqual(["chatgpt", "gemini"]);
  });
});

describe("validateDiagnosisInput", () => {
  const base = { brand: "ミナモ", category: "化粧水", concern: "乾燥" };
  it("正しい入力を整形する（制御文字除去・競合の重複と自社名を除外）", () => {
    const r = validateDiagnosisInput({ ...base, brand: " ミナモ\u0000 ", competitors: "ルーセント、ルーセント、ミナモ,アオバ", aliases: ["MINAMO"] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.brand).toBe("ミナモ");
      expect(r.value.competitors).toEqual(["ルーセント", "アオバ"]);
      expect(r.value.aliases).toEqual(["MINAMO"]);
    }
  });
  it("不正な入力を拒否する", () => {
    expect(validateDiagnosisInput(null).ok).toBe(false);
    expect(validateDiagnosisInput({ ...base, brand: "" }).ok).toBe(false);
    expect(validateDiagnosisInput({ ...base, brand: "あ".repeat(61) }).ok).toBe(false);
    expect(validateDiagnosisInput({ ...base, category: "<script>" }).ok).toBe(false);
    expect(validateDiagnosisInput({ ...base, concern: "不明" }).ok).toBe(false);
  });
  it("競合は5つまで", () => {
    const r = validateDiagnosisInput({ ...base, competitors: "a1,a2,a3,a4,a5,a6,a7" });
    expect(r.ok && r.value.competitors.length).toBe(5);
  });
});

describe("runDiagnosis", () => {
  const fake = (id: "chatgpt" | "gemini", reply: (q: string) => string | Error): Engine => ({
    id,
    label: id,
    async ask(q) {
      const r = reply(q);
      if (r instanceof Error) throw r;
      return { text: r, citations: [{ url: "https://www.cosme.example.jp/p", title: "p" }] };
    },
  });

  it("各AIに質問し、登場割合・順位・競合・参照サイトを集計する", async () => {
    const res = await runDiagnosis(
      { brand: "ミナモ", aliases: ["MINAMO"], competitors: ["ルーセント"], category: "化粧水", concern: "乾燥" },
      [fake("chatgpt", () => "ルーセントとMINAMOがおすすめ"), fake("gemini", () => "ルーセントが人気")],
      { questionCount: 3, now: () => new Date("2026-11-02T00:00:00Z") },
    );
    expect(res.questions).toHaveLength(3);
    expect(res.answers).toHaveLength(6);
    expect(res.ownRate).toBe(0.5);
    expect(res.ownAvgRank).toBe(2);
    expect(res.engines.find((e) => e.id === "chatgpt")?.ownRate).toBe(1);
    expect(res.engines.find((e) => e.id === "gemini")?.ownRate).toBe(0);
    expect(res.competitors).toEqual([{ name: "ルーセント", rate: 1 }]);
    expect(res.topDomains[0]).toEqual({ domain: "cosme.example.jp", count: 6 });
  });

  it("一部のAIが失敗しても、取得できた回答だけで集計する", async () => {
    const res = await runDiagnosis(
      { brand: "ミナモ", aliases: [], competitors: [], category: "化粧水", concern: "乾燥" },
      [fake("chatgpt", () => "ミナモ"), fake("gemini", () => new EngineError("server", "x"))],
      { questionCount: 2 },
    );
    expect(res.answers).toHaveLength(2);
    expect(res.engines.find((e) => e.id === "gemini")).toMatchObject({ answered: 0, failed: 2 });
    expect(res.failures.server).toBe(2);
    expect(res.ownRate).toBe(1);
  });

  it("時間切れになった呼び出しは打ち切る", async () => {
    const slow: Engine = {
      id: "chatgpt",
      label: "slow",
      ask: (_q, signal) =>
        new Promise((_, reject) => signal.addEventListener("abort", () => reject(new EngineError("timeout", "t")))),
    };
    const res = await runDiagnosis({ brand: "x1", aliases: [], competitors: [], category: "化粧水", concern: "乾燥" }, [slow], {
      questionCount: 1,
      timeoutMs: 10,
    });
    expect(res.answers).toHaveLength(0);
    expect(res.failures.timeout).toBe(1);
  });
});

describe("RateLimiter", () => {
  it("1つの送信元からの回数と、1日の合計を制限する", () => {
    const rl = new RateLimiter(2, 1000, 3);
    expect(rl.check("a", 0).ok).toBe(true);
    expect(rl.check("a", 1).ok).toBe(true);
    expect(rl.check("a", 2)).toEqual({ ok: false, reason: "per_key" });
    expect(rl.check("a", 1500).ok).toBe(true); // 時間窓が過ぎれば再び可
    expect(rl.check("b", 1600)).toEqual({ ok: false, reason: "daily" });
  });
});
