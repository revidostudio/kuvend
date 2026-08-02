import { describe, expect, it, vi } from "vitest";
import path from "node:path";
import { MemoryAdminAuditStore } from "./audit-store.js";
import { buildApp } from "./app.js";

describe("admin trust domain", () => {
  it("requires an actor and writes an audit event for moderation", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          applied: true,
          proposal: { id: "proposal", title: "Titull", category: "transport" },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    const auditStore = new MemoryAdminAuditStore();
    const app = buildApp({
      auditStore,
      fetchImpl,
      civicUrl: "https://civic.test",
      adminKey: "key",
      clientRoot: path.resolve("src/client"),
    });
    const page = await app.inject({ method: "GET", url: "/" });
    expect(page.statusCode).toBe(200);
    expect(page.body).toContain('<div id="root"></div>');
    const response = await app.inject({
      method: "POST",
      url: "/v1/proposals/11111111-1111-4111-8111-111111111111/moderate",
      headers: { authorization: "Bearer key", "x-admin-actor": "moderatori-a" },
      payload: { status: "voting_open", note: "Propozimi plotëson rregullat." },
    });
    expect(response.statusCode).toBe(200);
    expect(await auditStore.list()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actor: "moderatori-a",
          action: "moderate:voting_open",
          outcome: "accepted",
        }),
        expect.objectContaining({
          actor: "moderatori-a",
          action: "publish:voting-open-notification",
          outcome: "accepted",
        }),
      ]),
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(String(fetchImpl.mock.calls[0]?.[1]?.body)).not.toContain("phone");
    await app.close();
  });
});
