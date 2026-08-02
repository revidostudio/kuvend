import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { MemoryNotificationStore } from "./store.js";

describe("notification boundary", () => {
  it("rejects civic and phone fields", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "POST",
      url: "/v1/subscriptions",
      payload: {
        endpoint: "https://push.example/sub",
        keys: { p256dh: "x".repeat(65), auth: "x".repeat(16) },
        categories: [],
        phone: "+355691234567",
        vote: "support",
      },
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("updates subscriptions by endpoint hash and prunes expired entries", async () => {
    const store = new MemoryNotificationStore();
    await store.put({
      endpoint: "https://push.example/private-endpoint",
      expirationTime: 100,
      keys: { p256dh: "p".repeat(65), auth: "a".repeat(16) },
      categories: ["transport"],
    });
    await store.put({
      endpoint: "https://push.example/private-endpoint",
      expirationTime: 100,
      keys: { p256dh: "p".repeat(65), auth: "a".repeat(16) },
      categories: ["education"],
    });
    expect(await store.count()).toBe(1);
    expect((await store.list())[0]?.categories).toEqual(["education"]);
    expect(await store.pruneExpired(new Date(101))).toBe(1);
    expect(await store.count()).toBe(0);
  });
});
