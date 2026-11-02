import { connection } from "next/server";

/**
 * 脆弱性の報告窓口（RFC 9116）。SECURITY_CONTACT（mailto: または https: のURL）を設定したときだけ公開する。
 * 未設定のときは 404（存在しない窓口を案内しない）。
 */
export async function GET() {
  await connection();
  const contact = process.env.SECURITY_CONTACT ?? "";
  if (!/^(mailto:[^\s@]+@[^\s@]+|https:\/\/\S+)$/.test(contact)) return new Response("Not Found", { status: 404 });
  const expires = new Date(Date.now() + 180 * 86400000).toISOString();
  const body = [`Contact: ${contact}`, `Expires: ${expires}`, "Preferred-Languages: ja, en", ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
}
