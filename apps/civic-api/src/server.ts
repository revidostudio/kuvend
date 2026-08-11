import { buildApp } from "./app.js";
import { PostgresCivicStore } from "./postgres-store.js";
import { MemoryCivicStore, type CivicStore } from "./store.js";

async function start(): Promise<void> {
  let store: CivicStore = new MemoryCivicStore();
  if (process.env.DATABASE_URL) {
    const postgresStore = new PostgresCivicStore(process.env.DATABASE_URL);
    await postgresStore.initialize();
    store = postgresStore;
  }
  const app = buildApp(store);
  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: "0.0.0.0" });
  process.stdout.write(`Kuvend civic API listening on ${port} (${store.kind}; semaphore-v4)\n`);
}

start().catch((error: unknown) => {
  process.stderr.write(
    `Civic API failed: ${error instanceof Error ? error.message : "unknown error"}\n`,
  );
  process.exitCode = 1;
});
