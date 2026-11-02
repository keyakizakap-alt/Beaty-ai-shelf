import { connection } from "next/server";
import { runDiagnosis, validateDiagnosisInput } from "@/lib/diagnosis";
import { getConfiguredEngines } from "@/lib/engines/registry";
import { RateLimiter } from "@/lib/rate-limit";
import { clientIp, hashForLog, isSameOrigin, logEvent, readJsonLimited } from "@/lib/security";

// 6問 × AIの数を並列で聞くため、余裕をもたせる（実行上限はデプロイ先の設定にも依存する）
export const maxDuration = 120;

const MAX_BODY_BYTES = 10_000;

const intEnv = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : d;
};

const limiter = new RateLimiter(
  intEnv(process.env.DIAGNOSIS_PER_IP_LIMIT, 3),
  60 * 60 * 1000,
  intEnv(process.env.DIAGNOSIS_DAILY_LIMIT, 50),
);

function json(body: Record<string, unknown>, status: number, requestId: string) {
  return Response.json(
    { ...body, requestId },
    { status, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId } },
  );
}

/** 診断が使えるか（どのAIに接続できるか）を返す。キーの値は返さない */
export async function GET() {
  await connection();
  const engines = getConfiguredEngines();
  return Response.json(
    { available: engines.length > 0, engines: engines.map((e) => e.label) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  await connection();
  const requestId = crypto.randomUUID();
  const started = Date.now();
  const ip = clientIp(request.headers);
  const ipHash = await hashForLog(ip);
  const fail = (status: number, error: string, message: string) => {
    logEvent("diagnosis", { requestId, ipHash, status, error, ms: Date.now() - started });
    return json({ error, message }, status, requestId);
  };

  // 別サイトからの送信を拒否する（CSRF・不正利用対策）。他の判定より先に行う
  if (!isSameOrigin(request.headers)) return fail(403, "forbidden", "このページからのみ利用できます。");

  const engines = getConfiguredEngines();
  if (engines.length === 0) return fail(503, "unavailable", "無料診断は準備中です。");

  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return fail(415, "unsupported_media_type", "入力の形式が正しくありません。");
  }

  // 本文は上限を超えた時点で読むのをやめる（Content-Length を偽った大きな送信への対策）
  const read = await readJsonLimited(request, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.reason === "too_large"
      ? fail(413, "too_large", "入力が大きすぎます。")
      : fail(400, "bad_request", "入力の形式が正しくありません。");
  }
  const body = read.value;

  // ボット対策：人には見えない入力欄に値が入っていたら受け付けない
  if (body && typeof body === "object" && (body as Record<string, unknown>).website) {
    return fail(400, "bad_request", "送信できませんでした。");
  }

  const parsed = validateDiagnosisInput(body);
  if (!parsed.ok) return fail(400, "invalid", parsed.error);

  const rl = limiter.check(ip);
  if (!rl.ok) {
    return fail(
      429,
      "rate_limited",
      rl.reason === "daily"
        ? "本日の無料診断の受付数が上限に達しました。明日あらためてお試しください。"
        : "短時間に続けて診断できる回数を超えました。1時間ほどしてからお試しください。",
    );
  }

  try {
    const result = await runDiagnosis(parsed.value, engines, {
      questionCount: intEnv(process.env.DIAGNOSIS_QUESTIONS, 6),
    });
    if (result.answers.length === 0) {
      logEvent("diagnosis", { requestId, ipHash, status: 502, failures: result.failures, ms: Date.now() - started });
      return json({ error: "engines_failed", message: "AIからの回答を取得できませんでした。時間をおいてお試しください。" }, 502, requestId);
    }
    // ログにはブランド名や回答本文を残さない（企業の機密になりうるため）
    logEvent("diagnosis", {
      requestId,
      ipHash,
      status: 200,
      answers: result.answers.length,
      failures: result.failures,
      ms: Date.now() - started,
    });
    return json({ ...result }, 200, requestId);
  } catch {
    // 内部のエラー内容は利用者に返さない
    return fail(500, "internal", "診断中に問題が発生しました。時間をおいてお試しください。");
  }
}
