import { MemoryAdminAuditStore, PostgresAdminAuditStore } from "./audit-store.js";
import { buildApp } from "./app.js";

const auditStore = process.env.DATABASE_URL
  ? new PostgresAdminAuditStore(process.env.DATABASE_URL)
  : new MemoryAdminAuditStore();
await auditStore.initialize();
await buildApp({ auditStore }).listen({
  host: "0.0.0.0",
  port: Number(process.env.PORT ?? 4003),
});
