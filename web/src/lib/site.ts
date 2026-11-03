/**
 * 公開URL（検索エンジン向けの sitemap・robots や、SNS共有時のURLに使う）。
 * 優先順位：SITE_URL（独自ドメインを使う場合に設定）→ Vercel が自動で渡す本番URL → ローカル開発。
 * 参考：Vercel のシステム環境変数 VERCEL_PROJECT_PRODUCTION_URL（https を含まないホスト名）。
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): URL {
  const explicit = env.SITE_URL?.trim();
  if (explicit) {
    try {
      const u = new URL(explicit);
      if (u.protocol === "https:" || u.hostname === "localhost") return new URL(u.origin);
    } catch {
      // 不正な値は無視して次の候補へ
    }
  }
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel && /^[a-z0-9.-]+$/i.test(vercel)) return new URL(`https://${vercel}`);
  return new URL("http://localhost:3000");
}

/** 検索エンジンに載せる公開ページ（ツール画面と API は載せない） */
export const PUBLIC_PATHS = ["/", "/diagnosis", "/security", "/privacy", "/terms"] as const;
