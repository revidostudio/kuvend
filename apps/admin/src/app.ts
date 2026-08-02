import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { z } from "zod";
import { MemoryAdminAuditStore, type AdminAuditStore } from "./audit-store.js";

const moderationSchema = z
  .object({
    status: z.enum(["needs_changes", "duplicate", "rejected", "voting_open"]),
    note: z.string().trim().min(4).max(2_000),
    duplicateOf: z.string().uuid().optional(),
  })
  .strict();

const responseSchema = z
  .object({
    institution: z.string().trim().min(2).max(180),
    status: z.enum(["awaiting_response", "responded", "no_response"]),
    responseText: z.string().trim().max(5_000).optional(),
    sourceUrl: z.string().url().startsWith("https://").optional(),
    note: z.string().trim().min(4).max(1_000),
  })
  .strict();

const defaultClientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client");

export function buildApp(
  options: {
    auditStore?: AdminAuditStore;
    fetchImpl?: typeof fetch;
    civicUrl?: string;
    notificationsUrl?: string;
    adminKey?: string;
    clientRoot?: string;
  } = {},
) {
  const app = Fastify({ logger: false, bodyLimit: 12_000 });
  const clientRoot = options.clientRoot ?? defaultClientRoot;
  if (existsSync(clientRoot)) {
    void app.register(fastifyStatic, { root: clientRoot, wildcard: false, index: false });
  }
  const civicUrl = options.civicUrl ?? process.env.CIVIC_API_URL ?? "http://localhost:4000";
  const notificationsUrl =
    options.notificationsUrl ?? process.env.NOTIFICATIONS_URL ?? "http://localhost:4004";
  const adminKey = options.adminKey ?? process.env.ADMIN_API_KEY ?? "development-admin-key";
  const fetchImpl = options.fetchImpl ?? fetch;
  const auditStore = options.auditStore ?? new MemoryAdminAuditStore();

  app.addHook("onSend", async (_request, reply, payload) => {
    reply.header(
      "content-security-policy",
      "default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    reply.header("x-frame-options", "DENY");
    reply.header("cache-control", "no-store");
    return payload;
  });

  function identity(request: { headers: Record<string, unknown> }) {
    const authorized = request.headers.authorization === `Bearer ${adminKey}`;
    const actor = request.headers["x-admin-actor"];
    return { authorized, actor: typeof actor === "string" && actor.trim() ? actor.trim() : "" };
  }

  app.get("/health", async () => ({
    ok: true,
    separateTrustDomain: true,
    auditStore: auditStore.kind,
    authentication: "synthetic-admin-key",
  }));
  app.get("/", async (_request, reply) => {
    if (existsSync(clientRoot)) return reply.sendFile("index.html");
    return reply
      .code(503)
      .type("text/plain")
      .send("Admin UI is not built. Run the Vite development server.");
  });
  app.get("/favicon.ico", async (_request, reply) => reply.code(204).send());

  app.get("/v1/moderation-cases", async (request, reply) => {
    const auth = identity(request);
    if (!auth.authorized || !auth.actor) return reply.code(401).send({ error: "unauthorized" });
    const response = await fetchImpl(`${civicUrl}/internal/moderation-cases`, {
      headers: { "x-admin-key": adminKey },
    });
    const data = (await response.json()) as {
      cases?: Array<{
        reason: string;
        proposal?: { title: string; problem: string; proposedChange: string };
        [key: string]: unknown;
      }>;
      [key: string]: unknown;
    };
    if (data.cases) {
      data.cases = data.cases.map((moderationCase) => ({
        ...moderationCase,
        reason: moderationCase.proposal
          ? `${moderationCase.proposal.title}\n\nProblemi: ${moderationCase.proposal.problem}\n\nNdryshimi: ${moderationCase.proposal.proposedChange}\n\nRasti: ${moderationCase.reason}`
          : moderationCase.reason,
      }));
    }
    return reply.code(response.status).send(data);
  });

  app.get("/v1/audit-events", async (request, reply) => {
    const auth = identity(request);
    if (!auth.authorized || !auth.actor) return reply.code(401).send({ error: "unauthorized" });
    return { events: await auditStore.list() };
  });

  app.post<{ Params: { id: string } }>("/v1/proposals/:id/moderate", async (request, reply) => {
    const auth = identity(request);
    if (!auth.authorized || !auth.actor) return reply.code(401).send({ error: "unauthorized" });
    const parsed = moderationSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_moderation" });
    const response = await fetchImpl(
      `${civicUrl}/internal/proposals/${request.params.id}/moderate`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ ...parsed.data, reviewer: auth.actor }),
      },
    );
    const responseData = (await response.json()) as {
      applied?: boolean;
      proposal?: { id: string; title: string; category: string };
      [key: string]: unknown;
    };
    await auditStore.append({
      actor: auth.actor,
      action: `moderate:${parsed.data.status}`,
      target: request.params.id,
      outcome: response.ok ? "accepted" : "failed",
    });
    if (
      response.ok &&
      parsed.data.status === "voting_open" &&
      responseData.applied &&
      responseData.proposal?.title &&
      responseData.proposal.category
    ) {
      const noticeResponse = await fetchImpl(`${notificationsUrl}/internal/publish`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          title: responseData.proposal.title,
          url: `/propozime/${request.params.id}`,
          category: responseData.proposal.category,
        }),
      }).catch(() => undefined);
      await auditStore.append({
        actor: auth.actor,
        action: "publish:voting-open-notification",
        target: request.params.id,
        outcome: noticeResponse?.ok ? "accepted" : "failed",
      });
    }
    return reply.code(response.status).send(responseData);
  });

  app.post<{ Params: { id: string } }>(
    "/v1/proposals/:id/institutional-response",
    async (request, reply) => {
      const auth = identity(request);
      if (!auth.authorized || !auth.actor) return reply.code(401).send({ error: "unauthorized" });
      const parsed = responseSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_response" });
      const response = await fetchImpl(
        `${civicUrl}/internal/proposals/${request.params.id}/institutional-response`,
        {
          method: "POST",
          headers: { "content-type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify({ ...parsed.data, recordedBy: auth.actor }),
        },
      );
      await auditStore.append({
        actor: auth.actor,
        action: `institutional-response:${parsed.data.status}`,
        target: request.params.id,
        outcome: response.ok ? "accepted" : "failed",
      });
      return reply.code(response.status).send(await response.json());
    },
  );
  return app;
}
