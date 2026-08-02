import postgres from "postgres";

export interface ChallengeRecord {
  id: string;
  phoneDigest: string;
  expiresAt: number;
  attempts: number;
}

export interface ChallengeStore {
  readonly kind: "memory" | "postgres";
  put(challenge: ChallengeRecord): Promise<void>;
  get(id: string): Promise<ChallengeRecord | undefined>;
  incrementAttempts(id: string): Promise<number>;
  delete(id: string): Promise<void>;
  prune(now?: number): Promise<number>;
  allowStart(
    phoneDigest: string,
    now?: number,
  ): Promise<{ allowed: boolean; retryAfterSeconds: number }>;
}

export class MemoryChallengeStore implements ChallengeStore {
  readonly kind = "memory" as const;
  private readonly challenges = new Map<string, ChallengeRecord>();
  private readonly starts = new Map<string, { windowStart: number; count: number }>();

  async put(challenge: ChallengeRecord) {
    this.challenges.set(challenge.id, { ...challenge });
  }

  async get(id: string) {
    const challenge = this.challenges.get(id);
    return challenge ? { ...challenge } : undefined;
  }

  async incrementAttempts(id: string) {
    const challenge = this.challenges.get(id);
    if (!challenge) return 0;
    challenge.attempts += 1;
    return challenge.attempts;
  }

  async delete(id: string) {
    this.challenges.delete(id);
  }

  async prune(now = Date.now()) {
    let removed = 0;
    for (const [id, challenge] of this.challenges) {
      if (challenge.expiresAt < now) {
        this.challenges.delete(id);
        removed += 1;
      }
    }
    for (const [digest, limit] of this.starts) {
      if (limit.windowStart + 10 * 60_000 < now) this.starts.delete(digest);
    }
    return removed;
  }

  async allowStart(phoneDigest: string, now = Date.now()) {
    const current = this.starts.get(phoneDigest);
    const limit =
      !current || current.windowStart + 10 * 60_000 <= now
        ? { windowStart: now, count: 1 }
        : { ...current, count: current.count + 1 };
    this.starts.set(phoneDigest, limit);
    return {
      allowed: limit.count <= 3,
      retryAfterSeconds: Math.max(1, Math.ceil((limit.windowStart + 10 * 60_000 - now) / 1_000)),
    };
  }
}

export class PostgresChallengeStore implements ChallengeStore {
  readonly kind = "postgres" as const;
  private readonly sql;

  constructor(databaseUrl: string) {
    this.sql = postgres(databaseUrl, { max: 5, idle_timeout: 20 });
  }

  async initialize() {
    await this.sql`
      create table if not exists otp_challenges (
        challenge_id uuid primary key,
        phone_digest text not null,
        expires_at timestamptz not null,
        attempts integer not null default 0,
        created_at timestamptz not null default now()
      )
    `;
    await this
      .sql`create index if not exists otp_challenges_expiry_idx on otp_challenges (expires_at)`;
    await this.sql`
      create table if not exists otp_start_limits (
        phone_digest text primary key,
        window_start timestamptz not null,
        attempts integer not null
      )
    `;
  }

  async put(challenge: ChallengeRecord) {
    await this.sql`
      insert into otp_challenges (challenge_id, phone_digest, expires_at, attempts)
      values (${challenge.id}, ${challenge.phoneDigest}, ${new Date(challenge.expiresAt)}, ${challenge.attempts})
      on conflict (challenge_id) do update set
        phone_digest = excluded.phone_digest,
        expires_at = excluded.expires_at,
        attempts = excluded.attempts
    `;
  }

  async get(id: string) {
    const rows = await this.sql<
      Array<{ challenge_id: string; phone_digest: string; expires_at: Date; attempts: number }>
    >`
      select challenge_id, phone_digest, expires_at, attempts
      from otp_challenges where challenge_id = ${id}
    `;
    const row = rows[0];
    return row
      ? {
          id: row.challenge_id,
          phoneDigest: row.phone_digest,
          expiresAt: row.expires_at.getTime(),
          attempts: row.attempts,
        }
      : undefined;
  }

  async incrementAttempts(id: string) {
    const rows = await this.sql<Array<{ attempts: number }>>`
      update otp_challenges set attempts = attempts + 1
      where challenge_id = ${id}
      returning attempts
    `;
    return rows[0]?.attempts ?? 0;
  }

  async delete(id: string) {
    await this.sql`delete from otp_challenges where challenge_id = ${id}`;
  }

  async prune(now = Date.now()) {
    const rows = await this.sql<Array<{ challenge_id: string }>>`
      delete from otp_challenges where expires_at < ${new Date(now)} returning challenge_id
    `;
    await this
      .sql`delete from otp_start_limits where window_start < ${new Date(now - 10 * 60_000)}`;
    return rows.length;
  }

  async allowStart(phoneDigest: string, now = Date.now()) {
    const currentTime = new Date(now);
    const resetBefore = new Date(now - 10 * 60_000);
    const rows = await this.sql<Array<{ attempts: number; window_start: Date }>>`
      insert into otp_start_limits (phone_digest, window_start, attempts)
      values (${phoneDigest}, ${currentTime}, 1)
      on conflict (phone_digest) do update set
        attempts = case when otp_start_limits.window_start <= ${resetBefore}
          then 1 else otp_start_limits.attempts + 1 end,
        window_start = case when otp_start_limits.window_start <= ${resetBefore}
          then ${currentTime} else otp_start_limits.window_start end
      returning attempts, window_start
    `;
    const limit = rows[0]!;
    return {
      allowed: limit.attempts <= 3,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((limit.window_start.getTime() + 10 * 60_000 - now) / 1_000),
      ),
    };
  }
}
