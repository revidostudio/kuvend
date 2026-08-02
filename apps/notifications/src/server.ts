import { buildApp } from "./app.js";
import { EncryptedPostgresNotificationStore, MemoryNotificationStore } from "./store.js";

const store = process.env.DATABASE_URL
  ? new EncryptedPostgresNotificationStore(
      process.env.DATABASE_URL,
      process.env.NOTIFICATION_ENCRYPTION_KEY ?? "development-notification-key",
    )
  : new MemoryNotificationStore();
await store.initialize();
await buildApp({ store }).listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 4004) });
