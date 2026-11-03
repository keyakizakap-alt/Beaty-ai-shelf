import { describe, expect, it } from "vitest";
import { PUBLIC_PATHS, siteUrl } from "../site";

describe("siteUrl", () => {
  it("SITE_URL（https）を最優先し、パスは捨てて origin だけ使う", () => {
    expect(siteUrl({ SITE_URL: "https://shelf.example.jp/abc", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" }).toString()).toBe(
      "https://shelf.example.jp/",
    );
  });
  it("http の SITE_URL や不正な値は使わない", () => {
    expect(siteUrl({ SITE_URL: "http://evil.example", VERCEL_PROJECT_PRODUCTION_URL: "p.vercel.app" }).host).toBe("p.vercel.app");
    expect(siteUrl({ SITE_URL: "not a url" }).host).toBe("localhost:3000");
  });
  it("Vercel の本番URLを https で使う。ホスト名以外の文字が入っていたら使わない", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "beaty-ai-shelf.vercel.app" }).toString()).toBe("https://beaty-ai-shelf.vercel.app/");
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "evil.example/path?x" }).host).toBe("localhost:3000");
  });
  it("何もなければローカル開発のURL", () => {
    expect(siteUrl({}).toString()).toBe("http://localhost:3000/");
  });
  it("検索エンジンに載せるのは公開ページだけ（ツール画面とAPIを含めない）", () => {
    expect(PUBLIC_PATHS.some((p) => p.startsWith("/app") || p.startsWith("/api"))).toBe(false);
  });
});
