import { z } from "zod";

const suggestionSchema = z
  .object({
    title: z.string().min(1).max(140),
    problem: z.string().min(1).max(3_000),
    proposedChange: z.string().min(1).max(3_000),
    changes: z.array(z.string().min(1).max(240)).max(8),
  })
  .strict();

export type GrammarDraft = {
  title: string;
  problem: string;
  proposedChange: string;
  locale: string;
};

export type GrammarSuggestion = z.infer<typeof suggestionSchema>;

export class OpenRouterError extends Error {
  constructor(public readonly code: "not_configured" | "unavailable" | "invalid_response") {
    super(code);
  }
}

function configuredKey(value: string | undefined) {
  const key = value?.trim() ?? "";
  return key && !/^(replace|placeholder|changeme|todo)[-_ ]/i.test(key) ? key : "";
}

export function openRouterConfigured(apiKey = process.env.OPENROUTER_API_KEY) {
  return Boolean(configuredKey(apiKey));
}

export async function correctAlbanianGrammar(
  draft: GrammarDraft,
  options: {
    apiKey?: string;
    model?: string;
    preset?: string;
    baseUrl?: string;
    fetch?: typeof fetch;
  } = {},
): Promise<GrammarSuggestion> {
  const apiKey = configuredKey(options.apiKey ?? process.env.OPENROUTER_API_KEY);
  if (!apiKey) throw new OpenRouterError("not_configured");

  const request = options.fetch ?? fetch;
  const response = await request(
    `${options.baseUrl ?? process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"}/chat/completions`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        "http-referer": "https://kuvend.org",
        "x-title": "Kuvend",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        model: options.model ?? process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash-lite",
        preset: options.preset ?? process.env.OPENROUTER_PRESET ?? "gdpr-and-zdr",
        temperature: 0,
        provider: { zdr: true, require_parameters: true },
        messages: [
          {
            role: "system",
            content:
              "Ti je redaktor i kujdesshëm i shqipes. Korrigjo vetëm gramatikën, drejtshkrimin, shenjat e pikësimit dhe hapësirat. Mos shto, hiq ose ndrysho fakte, pretendime, institucione, intensitet politik apo kuptimin. Ruaj dialektin dhe fjalorin e autorit kur janë të kuptueshme. Kthe vetëm JSON sipas skemës.",
          },
          {
            role: "user",
            content: JSON.stringify({
              task: "Korrigjo gramatikën dhe drejtshkrimin pa ndryshuar kuptimin.",
              draft,
            }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "kuvend_grammar_suggestion",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string", maxLength: 140 },
                problem: { type: "string", maxLength: 3000 },
                proposedChange: { type: "string", maxLength: 3000 },
                changes: {
                  type: "array",
                  maxItems: 8,
                  items: { type: "string", maxLength: 240 },
                },
              },
              required: ["title", "problem", "proposedChange", "changes"],
            },
          },
        },
      }),
    },
  ).catch(() => {
    throw new OpenRouterError("unavailable");
  });

  if (!response.ok) throw new OpenRouterError("unavailable");
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new OpenRouterError("invalid_response");
  try {
    return suggestionSchema.parse(JSON.parse(content));
  } catch {
    throw new OpenRouterError("invalid_response");
  }
}
