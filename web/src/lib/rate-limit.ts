/**
 * 簡易レート制限（メモリ内）。
 * 制約：サーバーのインスタンスごとに数えるため、複数インスタンスでは合計が上限を超えうる。
 * 本番で利用者が増えたら、Upstash Redis や Supabase など共有ストアに移す（ADR-005）。
 * 費用の上限は、各社管理画面の利用上限でも必ず二重に設定する。
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private day = "";
  private dayCount = 0;

  constructor(
    private readonly perKeyLimit: number,
    private readonly windowMs: number,
    private readonly dailyLimit: number,
  ) {}

  check(key: string, now = Date.now()): { ok: true } | { ok: false; reason: "per_key" | "daily" } {
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== this.day) {
      this.day = today;
      this.dayCount = 0;
    }
    if (this.dayCount >= this.dailyLimit) return { ok: false, reason: "daily" };
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.perKeyLimit) {
      this.hits.set(key, recent);
      return { ok: false, reason: "per_key" };
    }
    recent.push(now);
    this.hits.set(key, recent);
    this.dayCount++;
    // メモリが増え続けないよう、古いキーを掃除する
    if (this.hits.size > 5000) {
      for (const [k, v] of this.hits) if (v.every((t) => now - t >= this.windowMs)) this.hits.delete(k);
    }
    return { ok: true };
  }
}
