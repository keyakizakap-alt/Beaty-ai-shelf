/**
 * サーバー側で使うセキュリティ関連の小さな部品。
 */

/**
 * 送信元IPを取り出す。
 * Vercel は x-forwarded-for を上書きし、外部から送られた値を転送しない（なりすまし対策）。
 * Vercel の前段に別のプロキシを置く場合に備えて x-vercel-forwarded-for を優先する。
 * 参考：https://vercel.com/docs/headers/request-headers（2026-11-02 確認・公式）
 * 注意：Vercel 以外で動かす場合、これらのヘッダーは利用者が偽装できる。
 */
export function clientIp(headers: Headers): string {
  const raw =
    headers.get("x-vercel-forwarded-for") ?? headers.get("x-real-ip") ?? headers.get("x-forwarded-for") ?? "";
  const first = raw.split(",")[0]?.trim() ?? "";
  // IPアドレスとして使える文字だけを許可する（ログやキーへの混入を防ぐ）
  return /^[0-9a-fA-F:.]{2,45}$/.test(first) ? first : "unknown";
}

/** Origin ヘッダーが自サイトと一致するか（CSRF・他サイトからの不正利用対策） */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** 本文を上限バイト数までしか読まずに JSON として解釈する */
export async function readJsonLimited(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; reason: "too_large" | "invalid" }> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return { ok: false, reason: "too_large" };
  if (!request.body) return { ok: false, reason: "invalid" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return { ok: false, reason: "too_large" };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

/**
 * ログ用に値をハッシュ化する（IPアドレスをそのまま残さない）。
 * LOG_SALT を設定すると、ハッシュから元の値を推測されにくくなる。
 */
export async function hashForLog(value: string): Promise<string> {
  const data = new TextEncoder().encode(`${process.env.LOG_SALT ?? "beauty-ai-shelf"}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 1行のJSONで構造化ログを出す（個人情報・機密情報は入れない） */
export function logEvent(event: string, fields: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "test") return;
  console.info(JSON.stringify({ event, at: new Date().toISOString(), ...fields }));
}
