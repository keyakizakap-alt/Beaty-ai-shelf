import { describe, expect, it } from "vitest";
import { buildCsp } from "../../proxy";
import { clientIp, hashForLog, isSameOrigin, readJsonLimited } from "../security";
import { parseWorkspace } from "../storage";

describe("clientIp", () => {
  it("Vercel のヘッダーを優先し、先頭のIPだけを使う", () => {
    const h = new Headers({ "x-vercel-forwarded-for": "203.0.113.1", "x-forwarded-for": "198.51.100.9, 10.0.0.1" });
    expect(clientIp(h)).toBe("203.0.113.1");
    expect(clientIp(new Headers({ "x-forwarded-for": "198.51.100.9, 10.0.0.1" }))).toBe("198.51.100.9");
    expect(clientIp(new Headers({ "x-real-ip": "2001:db8::1" }))).toBe("2001:db8::1");
  });
  it("IPとして不正な値は使わない（ログやキーへの混入防止）", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "<script>alert(1)</script>" }))).toBe("unknown");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("isSameOrigin", () => {
  it("同じホストからの送信だけを許可する", () => {
    expect(isSameOrigin(new Headers({ origin: "https://app.example.com", host: "app.example.com" }))).toBe(true);
    expect(isSameOrigin(new Headers({ origin: "https://evil.example", host: "app.example.com" }))).toBe(false);
    expect(isSameOrigin(new Headers({ origin: "null", host: "app.example.com" }))).toBe(false);
    expect(isSameOrigin(new Headers({ host: "app.example.com" }))).toBe(false);
  });
});

describe("readJsonLimited", () => {
  const req = (body: BodyInit, headers: Record<string, string> = {}) =>
    new Request("http://x/", { method: "POST", body, headers, duplex: "half" } as RequestInit);

  it("上限以内なら JSON を返す", async () => {
    expect(await readJsonLimited(req('{"a":1}'), 100)).toEqual({ ok: true, value: { a: 1 } });
  });
  it("Content-Length を偽っても、実際の大きさで打ち切る", async () => {
    const stream = new ReadableStream({
      start(c) {
        for (let i = 0; i < 10; i++) c.enqueue(new TextEncoder().encode("x".repeat(100)));
        c.close();
      },
    });
    expect(await readJsonLimited(req(stream, { "content-length": "10" }), 500)).toEqual({ ok: false, reason: "too_large" });
  });
  it("宣言された大きさが上限超えなら読まずに拒否", async () => {
    expect(await readJsonLimited(req("{}", { "content-length": "99999" }), 100)).toEqual({ ok: false, reason: "too_large" });
  });
  it("JSON でない・不正な文字コードは invalid", async () => {
    expect(await readJsonLimited(req("not json"), 100)).toEqual({ ok: false, reason: "invalid" });
    expect(await readJsonLimited(req(new Uint8Array([0xff, 0xfe, 0x7b])), 100)).toEqual({ ok: false, reason: "invalid" });
  });
});

describe("hashForLog", () => {
  it("同じ値は同じハッシュ、元の値は含まない", async () => {
    const a = await hashForLog("203.0.113.1");
    expect(a).toBe(await hashForLog("203.0.113.1"));
    expect(a).not.toContain("203");
    expect(a).toHaveLength(16);
  });
});

describe("buildCsp", () => {
  it("本番ではインラインスクリプトと eval を許可しない", () => {
    const csp = buildCsp("abc", false);
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self';");
  });
});

describe("parseWorkspace の大きさ制限", () => {
  it("件数が多すぎるデータは読み込まない", () => {
    const base = {
      version: 1,
      brands: [{ id: "o", name: "x", aliases: [], isOwn: true }],
      profile: { category: "化粧水", concerns: [], ageBands: [], priceBand: "指定なし" },
      questions: [],
      observations: [],
    };
    const many = Array.from({ length: 51 }, (_, i) => ({ id: `q${i}`, text: "t", generated: false }));
    expect(parseWorkspace({ ...base, questions: many }).ok).toBe(false);
    const brands = Array.from({ length: 12 }, (_, i) => ({ id: `b${i}`, name: `b${i}`, aliases: [], isOwn: i === 0 }));
    expect(parseWorkspace({ ...base, brands }).ok).toBe(false);
  });
});
