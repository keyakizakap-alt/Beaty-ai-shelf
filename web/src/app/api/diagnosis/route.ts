import { connection } from "next/server";
import { runDiagnosis, validateDiagnosisInput } from "@/lib/diagnosis";
import { getConfiguredEngines } from "@/lib/engines/registry";
import { RateLimiter } from "@/lib/rate-limit";

// 6問 × AIの数を並列で聞くため、余裕をもたせる（実行上限はデプロイ先の設定にも依存する）
export const maxDuration = 120;

const intEnv = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : d;
};

const limiter = new RateLimiter(
  intEnv(process.env.DIAGNOSIS_PER_IP_LIMIT, 3),
  60 * 60 * 1000,
  intEnv(process.env.DIAGNOSIS_DAILY_LIMIT, 50),
);

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** 診断が使えるか（どのAIに接続できるか）を返す。キーの値は返さない */
export async function GET() {
  await connection();
  const engines = getConfiguredEngines();
  return json({ available: engines.length > 0, engines: engines.map((e) => e.label) });
}

export async function POST(request: Request) {
  await connection();
  const engines = getConfiguredEngines();
  if (engines.length === 0) {
    return json({ error: "unavailable", message: "無料診断は準備中です。" }, 503);
  }

  // 別サイトからの送信を拒否する（CSRF・不正利用対策）
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = !!origin && !!host && new URL(origin).host === host;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) {
    return json({ error: "forbidden", message: "このページからのみ利用できます。" }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 10_000) return json({ error: "too_large", message: "入力が大きすぎます。" }, 413);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request", message: "入力の形式が正しくありません。" }, 400);
  }

  // ボット対策：人には見えない入力欄に値が入っていたら受け付けない
  if (body && typeof body === "object" && (body as Record<string, unknown>).website) {
    return json({ error: "bad_request", message: "送信できませんでした。" }, 400);
  }

  const parsed = validateDiagnosisInput(body);
  if (!parsed.ok) return json({ error: "invalid", message: parsed.error }, 400);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = limiter.check(ip);
  if (!rl.ok) {
    return json(
      {
        error: "rate_limited",
        message:
          rl.reason === "daily"
            ? "本日の無料診断の受付数が上限に達しました。明日あらためてお試しください。"
            : "短時間に続けて診断できる回数を超えました。1時間ほどしてからお試しください。",
      },
      429,
    );
  }

  const result = await runDiagnosis(parsed.value, engines, {
    questionCount: intEnv(process.env.DIAGNOSIS_QUESTIONS, 6),
  });
  if (result.answers.length === 0) {
    return json({ error: "engines_failed", message: "AIからの回答を取得できませんでした。時間をおいてお試しください。" }, 502);
  }
  return json(result);
}
