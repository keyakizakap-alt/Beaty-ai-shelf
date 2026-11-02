import type { EngineId } from "../types";

export interface Citation {
  url: string;
  title: string;
}

export interface EngineAnswer {
  text: string;
  citations: Citation[];
}

export type EngineErrorKind = "auth" | "rate_limit" | "server" | "timeout" | "bad_response" | "network";

export class EngineError extends Error {
  constructor(
    public readonly kind: EngineErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

/** 消費者が使うAI（測る対象）への接続 */
export interface Engine {
  id: EngineId;
  label: string;
  ask(question: string, signal: AbortSignal): Promise<EngineAnswer>;
}

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export function errorFromStatus(status: number, engine: string): EngineError {
  if (status === 401 || status === 403) return new EngineError("auth", `${engine}: 認証に失敗しました`, status);
  if (status === 429) return new EngineError("rate_limit", `${engine}: 利用上限に達しました`, status);
  if (status >= 500) return new EngineError("server", `${engine}: サーバーエラー`, status);
  return new EngineError("bad_response", `${engine}: リクエストが受け付けられませんでした`, status);
}

/** fetch の失敗を EngineError に変換する */
export async function callJson(fetchFn: FetchLike, url: string, init: RequestInit, engine: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(url, init);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw new EngineError("timeout", `${engine}: 時間切れ`);
    throw new EngineError("network", `${engine}: 通信に失敗しました`);
  }
  if (!res.ok) throw errorFromStatus(res.status, engine);
  try {
    return await res.json();
  } catch {
    throw new EngineError("bad_response", `${engine}: 応答を読み取れませんでした`);
  }
}

export function uniqueCitations(list: Citation[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of list) {
    if (!c.url || seen.has(c.url)) continue;
    seen.add(c.url);
    out.push(c);
  }
  return out;
}
