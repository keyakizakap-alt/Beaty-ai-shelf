import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PUBLIC_PATHS.map((path) => ({
    url: new URL(path, base).toString(),
    changeFrequency: path === "/" || path === "/diagnosis" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/diagnosis" ? 0.8 : 0.4,
  }));
}
