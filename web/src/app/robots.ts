import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // ツール画面（ブラウザ内のデータを表示する）と API は検索結果に出さない
      disallow: ["/app/", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
