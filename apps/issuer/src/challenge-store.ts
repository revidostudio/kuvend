import postgres from "postgres";

export interface ChallengeRecord {
  id: string;
  phoneDigest: string;
  verificationState?: string;
  expiresAt: number;
  attempts: number;
  identityCommitment: string;
}

export interface MembershipRecord {
  phoneDigest: string;
  identityCommitment: string;
  expiresAt: number;
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
  putMembership(
    record: MembershipRecord,
    now?: number,
  ): Promise<"created" | "renewed" | "conflict">;
  activeCommitments(now?: number): Promise<string[]>;
}

export class MemoryChallengeStore implements ChallengeStore {
  readonly kind = "memory" as const;
  private readonly challenges = new Map<string, ChallengeRecord>();
  private readonly starts = new Map<string, { windowStart: number; count: number }>();
  private readonly memberships = new Map<string, MembershipRecord>();

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

  async putMembership(record: MembershipRecord, now = Date.now()) {
    const current = this.memberships.get(record.phoneDigest);
    if (
      current &&
      current.expiresAt > now &&
      current.identityCommitment !== record.identityCommitment
    )
      return "conflict" as const;
    this.memberships.set(record.phoneDigest, { ...record });
    return current ? ("renewed" as const) : ("created" as const);
  }

  async activeCommitments(now = Date.now()) {
    return [...this.memberships.values()]
      .filter((record) => record.expiresAt > now)
      .map((record) => record.identityCommitment)
      .sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0));
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
        verification_state text,
        expires_at timestamptz not null,
        attempts integer not null default 0,
        identity_commitment text not null default '0',
        created_at timestamptz not null default now()
      )
    `;
    await this.sql`alter table otp_challenges add column if not exists verification_state text`;
    await this
      .sql`alter table otp_challenges add column if not exists identity_commitment text not null default '0'`;
    await this
      .sql`create index if not exists otp_challenges_expiry_idx on otp_challenges (expires_at)`;
    await this.sql`
      create table if not exists otp_start_limits (
        phone_digest text primary key,
        window_start timestamptz not null,
        attempts integer not null
      )
    `;
    await this.sql`
      create table if not exists anonymous_memberships (
        phone_digest text primary key,
        identity_commitment text not null unique,
        expires_at timestamptz not null,
        created_at timestamptz not null default now(),
        renewed_at timestamptz not null default now()
      )
    `;
    await this
      .sql`create index if not exists anonymous_memberships_expiry_idx on anonymous_memberships (expires_at)`;
  }

  async put(challenge: ChallengeRecord) {
    await this.sql`
      insert into otp_challenges (challenge_id, phone_digest, verification_state, expires_at, attempts, identity_commitment)
      values (${challenge.id}, ${challenge.phoneDigest}, ${challenge.verificationState ?? null}, ${new Date(challenge.expiresAt)}, ${challenge.attempts}, ${challenge.identityCommitment})
      on conflict (challenge_id) do update set
        phone_digest = excluded.phone_digest,
        verification_state = excluded.verification_state,
        expires_at = excluded.expires_at,
        attempts = excluded.attempts,
        identity_commitment = excluded.identity_commitment
    `;
  }

  async get(id: string) {
    const rows = await this.sql<
      Array<{
        challenge_id: string;
        phone_digest: string;
        verification_state: string | null;
        expires_at: Date;
        attempts: number;
        identity_commitment: string;
      }>
    >`
      select challenge_id, phone_digest, verification_state, expires_at, attempts, identity_commitment
      from otp_challenges where challenge_id = ${id}
    `;
    const row = rows[0];
    return row
      ? {
          id: row.challenge_id,
          phoneDigest: row.phone_digest,
          ...(row.verification_state ? { verificationState: row.verification_state } : {}),
          expiresAt: row.expires_at.getTime(),
          attempts: row.attempts,
          identityCommitment: row.identity_commitment,
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

  async putMembership(record: MembershipRecord, now = Date.now()) {
    const rows = await this.sql<Array<{ identity_commitment: string; expires_at: Date }>>`
      select identity_commitment, expires_at from anonymous_memberships
      where phone_digest = ${record.phoneDigest}
    `;
    const current = rows[0];
    if (
      current &&
      current.expires_at.getTime() > now &&
      current.identity_commitment !== record.identityCommitment
    )
      return "conflict" as const;
    try {
      await this.sql`
        insert into anonymous_memberships (phone_digest, identity_commitment, expires_at)
        values (${record.phoneDigest}, ${record.identityCommitment}, ${new Date(record.expiresAt)})
        on conflict (phone_digest) do update set
          identity_commitment = excluded.identity_commitment,
          expires_at = excluded.expires_at,
          renewed_at = now()
      `;
    } catch (error) {
      if (error instanceof postgres.PostgresError && error.code === "23505")
        return "conflict" as const;
      throw error;
    }
    return current ? ("renewed" as const) : ("created" as const);
  }

  async activeCommitments(now = Date.now()) {
    const rows = await this.sql<Array<{ identity_commitment: string }>>`
      select identity_commitment from anonymous_memberships
      where expires_at > ${new Date(now)}
      order by identity_commitment::numeric
    `;
    return rows.map((row) => row.identity_commitment);
  }
}
