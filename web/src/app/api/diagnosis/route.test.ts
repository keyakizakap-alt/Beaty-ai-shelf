import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ connection: async () => {} }));

async function loadRoute(env: Record<string, string>) {
  vi.resetModules();
  for (const k of ["OPENAI_API_KEY", "GEMINI_API_KEY"]) delete process.env[k];
  Object.assign(process.env, env);
  return import("./route");
}

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/diagnosis", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "http://localhost:3000", host: "localhost:3000", ...headers },
    body: JSON.stringify(body),
  });

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;
});

describe("/api/diagnosis", () => {
  it("キーが無いとき、GETは利用不可を返し、キーの値は含まない", async () => {
    const { GET } = await loadRoute({});
    const res = await GET();
    expect(await res.json()).toEqual({ available: false, engines: [] });
  });

  it("キーがあるとき、GETはAIの名前だけを返す", async () => {
    const { GET } = await loadRoute({ GEMINI_API_KEY: "secret-value" });
    const res = await GET();
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ available: true, engines: ["Gemini"] });
    expect(text).not.toContain("secret-value");
  });

  it("キーが無いとき、POSTは503", async () => {
    const { POST } = await loadRoute({});
    const res = await POST(post({ brand: "x", category: "化粧水", concern: "乾燥" }));
    expect(res.status).toBe(503);
  });

  it("別サイトからのPOSTは、キーの有無にかかわらず403", async () => {
    const noKey = await loadRoute({});
    expect((await noKey.POST(post({ brand: "x" }, { origin: "https://evil.example" }))).status).toBe(403);
    const { POST } = await loadRoute({ GEMINI_API_KEY: "k" });
    const res = await POST(post({ brand: "x", category: "化粧水", concern: "乾燥" }, { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("入力が不正なら400、ボット用の隠し欄に値があれば400", async () => {
    const { POST } = await loadRoute({ GEMINI_API_KEY: "k" });
    expect((await POST(post({ brand: "", category: "化粧水", concern: "乾燥" }))).status).toBe(400);
    expect((await POST(post({ brand: "x", category: "化粧水", concern: "乾燥", website: "http://spam" }))).status).toBe(400);
  });

  it("JSON 以外の形式は415、応答に内部情報やキーを含めない", async () => {
    const { POST } = await loadRoute({ GEMINI_API_KEY: "secret-key" });
    const res = await POST(
      new Request("http://localhost:3000/api/diagnosis", {
        method: "POST",
        headers: { "Content-Type": "text/plain", origin: "http://localhost:3000", host: "localhost:3000" },
        body: "brand=x",
      }),
    );
    expect(res.status).toBe(415);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(await res.text()).not.toContain("secret-key");
  });

  it("同じ送信元からの4回目は429（外部APIは呼ばない）", async () => {
    const { POST } = await loadRoute({ GEMINI_API_KEY: "k" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({ steps: [{ type: "model_output", content: [{ type: "text", text: "x" }] }] }), { status: 200 }),
    );
    const req = () => post({ brand: "x1", category: "化粧水", concern: "乾燥" }, { "x-forwarded-for": "203.0.113.9" });
    for (let i = 0; i < 3; i++) expect((await POST(req())).status).toBe(200);
    const callsBefore = fetchSpy.mock.calls.length;
    expect((await POST(req())).status).toBe(429);
    expect(fetchSpy.mock.calls.length).toBe(callsBefore);
    fetchSpy.mockRestore();
  });
});
