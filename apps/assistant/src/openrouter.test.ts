import { describe, expect, it } from "vitest";
import { correctAlbanianGrammar, OpenRouterError } from "./openrouter.js";

const draft = {
  title: "nje titull",
  problem: "ka shume hapesira ketu",
  proposedChange: "duhet ta rregullojme kete pjese",
  locale: "sq",
};

describe("OpenRouter grammar adapter", () => {
  it("requires a real API key", async () => {
    await expect(
      correctAlbanianGrammar(draft, { apiKey: "placeholder-openrouter-key" }),
    ).rejects.toMatchObject({ code: "not_configured" } satisfies Partial<OpenRouterError>);
  });

  it("requests ZDR structured output and parses the correction", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const result = await correctAlbanianGrammar(draft, {
      apiKey: "sk-or-test",
      fetch: async (_url, init) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    title: "Një titull",
                    problem: "Ka shumë hapësira këtu.",
                    proposedChange: "Duhet ta rregullojmë këtë pjesë.",
                    changes: ["U korrigjua drejtshkrimi."],
                  }),
                },
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    });
    expect(result.problem).toBe("Ka shumë hapësira këtu.");
    expect(requestBody?.model).toBe("openai/gpt-4o-mini");
    expect(requestBody?.preset).toBe("gdpr-and-zdr");
    expect(requestBody?.provider).toEqual({ zdr: true, require_parameters: true });
    expect(requestBody?.response_format).toMatchObject({ type: "json_schema" });
  });

  it("rejects malformed provider output", async () => {
    await expect(
      correctAlbanianGrammar(draft, {
        apiKey: "sk-or-test",
        fetch: async () =>
          new Response(JSON.stringify({ choices: [{ message: { content: "not-json" } }] }), {
            status: 200,
          }),
      }),
    ).rejects.toMatchObject({ code: "invalid_response" } satisfies Partial<OpenRouterError>);
  });
});
