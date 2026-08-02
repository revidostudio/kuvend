import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import postgres from "postgres";

export interface PushSubscriptionRecord {
  endpoint: string;
  expirationTime?: number | null;
  keys: { p256dh: string; auth: string };
  categories: string[];
}

export interface NotificationStore {
  readonly kind: "memory" | "postgres-encrypted";
  initialize(): Promise<void>;
  count(): Promise<number>;
  put(subscription: PushSubscriptionRecord): Promise<void>;
  delete(endpoint: string): Promise<void>;
  list(): Promise<PushSubscriptionRecord[]>;
  pruneExpired(now?: Date): Promise<number>;
}

function endpointHash(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

export class MemoryNotificationStore implements NotificationStore {
  readonly kind = "memory" as const;
  private readonly subscriptions = new Map<string, PushSubscriptionRecord>();
  async initialize() {}
  async count() {
    return this.subscriptions.size;
  }
  async put(subscription: PushSubscriptionRecord) {
    this.subscriptions.set(endpointHash(subscription.endpoint), structuredClone(subscription));
  }
  async delete(endpoint: string) {
    this.subscriptions.delete(endpointHash(endpoint));
  }
  async list() {
    return structuredClone([...this.subscriptions.values()]);
  }
  async pruneExpired(now = new Date()) {
    let removed = 0;
    for (const [hash, subscription] of this.subscriptions) {
      if (subscription.expirationTime && subscription.expirationTime <= now.getTime()) {
        this.subscriptions.delete(hash);
        removed += 1;
      }
    }
    return removed;
  }
}

export class EncryptedPostgresNotificationStore implements NotificationStore {
  readonly kind = "postgres-encrypted" as const;
  private readonly sql: postgres.Sql;
  private readonly key: Buffer;

  constructor(url: string, encryptionSecret: string) {
    this.sql = postgres(url, { max: 5, idle_timeout: 20 });
    this.key = createHash("sha256").update(encryptionSecret).digest();
  }

  async initialize() {
    await this.sql.unsafe(`
      create table if not exists push_subscriptions (
        endpoint_hash text primary key,
        encrypted_payload text not null,
        expires_at timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);
  }

  private encrypt(subscription: PushSubscriptionRecord): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(subscription), "utf8"),
      cipher.final(),
    ]);
    return [iv, cipher.getAuthTag(), ciphertext]
      .map((part) => part.toString("base64url"))
      .join(".");
  }

  private decrypt(payload: string): PushSubscriptionRecord {
    const [ivValue, tagValue, ciphertextValue] = payload.split(".");
    if (!ivValue || !tagValue || !ciphertextValue)
      throw new Error("invalid_subscription_ciphertext");
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(ciphertextValue, "base64url")),
        decipher.final(),
      ]).toString("utf8"),
    ) as PushSubscriptionRecord;
  }

  async count() {
    const [row] = await this.sql<{ count: number }[]>`
      select count(*)::int as count from push_subscriptions
    `;
    return row?.count ?? 0;
  }

  async put(subscription: PushSubscriptionRecord) {
    const expiresAt = subscription.expirationTime ? new Date(subscription.expirationTime) : null;
    await this.sql`
      insert into push_subscriptions ${this.sql({
        endpoint_hash: endpointHash(subscription.endpoint),
        encrypted_payload: this.encrypt(subscription),
        expires_at: expiresAt,
      })}
      on conflict (endpoint_hash) do update set
        encrypted_payload = excluded.encrypted_payload,
        expires_at = excluded.expires_at,
        updated_at = now()
    `;
  }

  async delete(endpoint: string) {
    await this.sql`delete from push_subscriptions where endpoint_hash = ${endpointHash(endpoint)}`;
  }

  async list() {
    const rows = await this.sql`select encrypted_payload from push_subscriptions`;
    return rows.map((row) => this.decrypt(String(row.encrypted_payload)));
  }

  async pruneExpired(now = new Date()) {
    const rows = await this.sql`
      delete from push_subscriptions where expires_at is not null and expires_at <= ${now}
      returning endpoint_hash
    `;
    return rows.length;
  }
}
