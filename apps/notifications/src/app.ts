import cors from "@fastify/cors";
import Fastify from "fastify";
import webpush from "web-push";
import { z } from "zod";
import { MemoryNotificationStore, type NotificationStore } from "./store.js";

const subscriptionSchema = z
  .object({
    endpoint: z.string().url(),
    expirationTime: z.number().nullable().optional(),
    keys: z.object({ p256dh: z.string().min(20), auth: z.string().min(10) }).strict(),
    categories: z.array(z.string().max(30)).max(10).default([]),
  })
  .strict();
const publishSchema = z
  .object({
    title: z.string().max(140),
    url: z.string().startsWith("/propozime/"),
    category: z.string().max(30),
  })
  .strict();

export function buildApp(options: { store?: NotificationStore } = {}) {
  const app = Fastify({ logger: false, bodyLimit: 8_000 });
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY)
  ) {
    throw new Error("Production notifications require stable VAPID keys");
  }
  const generated = webpush.generateVAPIDKeys();
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? generated.publicKey;
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? generated.privateKey;
  const store = options.store ?? new MemoryNotificationStore();
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:security@kuvend.org",
    publicKey,
    privateKey,
  );
  void app.register(cors, {
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/([a-z0-9-]+\.)?kuvend\.org$/,
      ...configuredOrigins,
    ],
    methods: ["GET", "POST", "DELETE"],
  });
  app.get("/health", async () => ({
    ok: true,
    separateTrustDomain: true,
    subscribers: await store.count(),
    store: store.kind,
    stableVapidKey: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  }));
  app.get("/v1/config", async () => ({ publicKey }));
  app.post("/v1/subscriptions", async (request, reply) => {
    const parsed = subscriptionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_subscription" });
    await store.put({
      endpoint: parsed.data.endpoint,
      keys: parsed.data.keys,
      categories: parsed.data.categories,
      ...(parsed.data.expirationTime !== undefined
        ? { expirationTime: parsed.data.expirationTime }
        : {}),
    });
    return reply.code(201).send({
      subscribed: true,
      privacy: "No vote, proposal, phone number, or civic identifier is accepted here.",
    });
  });
  app.delete("/v1/subscriptions", async (request, reply) => {
    const endpoint = (request.body as { endpoint?: unknown })?.endpoint;
    if (typeof endpoint !== "string") return reply.code(400).send({ error: "invalid_endpoint" });
    await store.delete(endpoint);
    return { subscribed: false };
  });
  app.post("/internal/publish", async (request, reply) => {
    if (request.headers["x-admin-key"] !== (process.env.ADMIN_API_KEY ?? "development-admin-key"))
      return reply.code(401).send({ error: "unauthorized" });
    const parsed = publishSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_public_notice" });
    let delivered = 0;
    await store.pruneExpired();
    for (const subscription of await store.list()) {
      if (subscription.categories.length && !subscription.categories.includes(parsed.data.category))
        continue;
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
            ...(subscription.expirationTime !== undefined
              ? { expirationTime: subscription.expirationTime }
              : {}),
          },
          JSON.stringify(parsed.data),
        );
        delivered += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number(error.statusCode)
            : undefined;
        if (statusCode === 404 || statusCode === 410) await store.delete(subscription.endpoint);
      }
    }
    return { delivered };
  });
  return app;
}
