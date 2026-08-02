import { randomUUID } from "node:crypto";
import postgres from "postgres";

export interface AdminAuditEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  outcome: "accepted" | "rejected" | "failed";
  occurredAt: string;
}

export interface AdminAuditStore {
  readonly kind: "memory" | "postgres";
  initialize(): Promise<void>;
  append(event: Omit<AdminAuditEvent, "id" | "occurredAt">): Promise<AdminAuditEvent>;
  list(limit?: number): Promise<AdminAuditEvent[]>;
}

export class MemoryAdminAuditStore implements AdminAuditStore {
  readonly kind = "memory" as const;
  private readonly events: AdminAuditEvent[] = [];
  async initialize() {}
  async append(event: Omit<AdminAuditEvent, "id" | "occurredAt">) {
    const record = { ...event, id: randomUUID(), occurredAt: new Date().toISOString() };
    this.events.unshift(record);
    return structuredClone(record);
  }
  async list(limit = 100) {
    return structuredClone(this.events.slice(0, limit));
  }
}

export class PostgresAdminAuditStore implements AdminAuditStore {
  readonly kind = "postgres" as const;
  private readonly sql: postgres.Sql;
  constructor(url: string) {
    this.sql = postgres(url, { max: 5, idle_timeout: 20 });
  }
  async initialize() {
    await this.sql.unsafe(`
      create table if not exists admin_audit_events (
        id uuid primary key,
        actor text not null,
        action text not null,
        target text not null,
        outcome text not null,
        occurred_at timestamptz not null default now()
      );
      revoke update, delete on admin_audit_events from public;
    `);
  }
  async append(event: Omit<AdminAuditEvent, "id" | "occurredAt">) {
    const id = randomUUID();
    const [row] = await this.sql`
      insert into admin_audit_events ${this.sql({ id, ...event })}
      returning *
    `;
    if (!row) throw new Error("audit_insert_failed");
    return {
      id: String(row.id),
      actor: String(row.actor),
      action: String(row.action),
      target: String(row.target),
      outcome: row.outcome as AdminAuditEvent["outcome"],
      occurredAt: new Date(String(row.occurred_at)).toISOString(),
    };
  }
  async list(limit = 100) {
    const rows = await this.sql`
      select * from admin_audit_events order by occurred_at desc limit ${Math.min(limit, 500)}
    `;
    return rows.map((row) => ({
      id: String(row.id),
      actor: String(row.actor),
      action: String(row.action),
      target: String(row.target),
      outcome: row.outcome as AdminAuditEvent["outcome"],
      occurredAt: new Date(String(row.occurred_at)).toISOString(),
    }));
  }
}
