import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("assistant", () => {
  it("allows an explicitly configured deployment origin", async () => {
    const previous = process.env.CORS_ALLOWED_ORIGINS;
    process.env.CORS_ALLOWED_ORIGINS = "https://web.example.test";
    const app = buildApp();
    const response = await app.inject({
      method: "OPTIONS",
      url: "/v1/assist",
      headers: { origin: "https://web.example.test", "access-control-request-method": "POST" },
    });
    expect(response.headers["access-control-allow-origin"]).toBe("https://web.example.test");
    await app.close();
    if (previous === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
    else process.env.CORS_ALLOWED_ORIGINS = previous;
  });

  it("keeps original text beside an optional suggestion", async () => {
    const app = buildApp({
      correctGrammar: async () => ({
        title: "Një titull",
        problem: "Ka shumë hapësira këtu.",
        proposedChange: "Duhet ta rregullojmë këtë pjesë.",
        changes: ["U korrigjua drejtshkrimi."],
      }),
    });
    const response = await app.inject({
      method: "POST",
      url: "/v1/assist",
      payload: {
        title: "nje titull",
        problem: "ka shume   hapesira ketu",
        proposedChange: "duhet ta rregullojme kete pjese",
        locale: "sq",
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().original.problem).toContain("shume   hapesira");
    expect(response.json().suggestion.problem).toBe("Ka shumë hapësira këtu.");
    expect(response.json().retained).toBe(false);
    expect(response.json().provider).toBe("openrouter");
    await app.close();
  });

  it("fails clearly when OpenRouter is unavailable instead of pretending to improve the draft", async () => {
    const app = buildApp({
      correctGrammar: async () => {
        throw new Error("provider unavailable");
      },
    });
    const response = await app.inject({
      method: "POST",
      url: "/v1/assist",
      payload: {
        title: "nje titull",
        problem: "ka shume hapesira ketu",
        proposedChange: "duhet ta rregullojme kete pjese",
        locale: "sq",
      },
    });
    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({ error: "grammar_assistant_unavailable" });
    await app.close();
  });

  it("suggests duplicates from the live civic catalogue without retaining a draft", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          proposals: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              title: "Strehë me hije në stacionet e autobusëve",
              problem: "Udhëtarët presin në diell në stacionet e autobusëve.",
            },
          ],
        }),
      );
    const app = buildApp({ civicApiUrl: "http://civic.test" });
    const response = await app.inject({
      method: "POST",
      url: "/v1/duplicates",
      payload: {
        title: "Hije për stacionet e autobusëve",
        problem: "Stacionet e autobusëve kanë nevojë për hije gjatë verës.",
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().suggestions[0].id).toBe("11111111-1111-4111-8111-111111111111");
    expect(response.json().retained).toBe(false);
    await app.close();
    globalThis.fetch = originalFetch;
  });
});
