import { buildApp } from "./app.js";
import { MemoryChallengeStore, PostgresChallengeStore } from "./challenge-store.js";

const store = process.env.DATABASE_URL
  ? new PostgresChallengeStore(process.env.DATABASE_URL)
  : new MemoryChallengeStore();
if (store instanceof PostgresChallengeStore) await store.initialize();
const app = buildApp({ store });
await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 4001) });
