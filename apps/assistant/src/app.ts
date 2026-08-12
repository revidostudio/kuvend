import cors from "@fastify/cors";
import { assistDraftSchema } from "@kuvend/contracts";
import { assertCivicSafe } from "@kuvend/privacy-testkit";
import Fastify from "fastify";
import { z } from "zod";
import { correctAlbanianGrammar, openRouterConfigured, OpenRouterError } from "./openrouter.js";

const duplicateSchema = z
  .object({ title: z.string().max(140), problem: z.string().max(3_000) })
  .strict();
const known = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Më shumë hije në stacionet e autobusëve",
    terms: ["hije", "stacion", "autobus"],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Publikimi i kontratave publike në format të hapur",
    terms: ["kontrata", "publike", "hapur"],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Kalime më të sigurta pranë shkollave",
    terms: ["kalime", "sigur", "shkoll"],
  },
];

type SearchProposal = { id: string; title: string; problem?: string; summary?: string };

function terms(value: string) {
  return Array.from(
    new Set(
      value
        .toLocaleLowerCase("sq-AL")
        .normalize("NFKD")
        .replace(/[^a-zëç0-9\s]/gi, " ")
        .split(/\s+/)
        .filter((term) => term.length >= 4),
    ),
  );
}

async function searchableProposals(civicApiUrl?: string): Promise<SearchProposal[]> {
  if (!civicApiUrl) return known.map(({ id, title }) => ({ id, title }));
  try {
    const response = await fetch(`${civicApiUrl}/v1/proposals`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(1_500),
    });
    if (!response.ok) throw new Error("civic_unavailable");
    const data = (await response.json()) as { proposals?: SearchProposal[] };
    return data.proposals?.slice(0, 500) ?? [];
  } catch {
    return known.map(({ id, title }) => ({ id, title }));
  }
}

export function buildApp(
  options: {
    civicApiUrl?: string;
    correctGrammar?: typeof correctAlbanianGrammar;
  } = {},
) {
  const app = Fastify({ logger: false, bodyLimit: 16_000 });
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  void app.register(cors, {
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/([a-z0-9-]+\.)?kuvend\.org$/,
      ...configuredOrigins,
    ],
    methods: ["GET", "POST"],
  });
  app.get("/health", async () => ({
    ok: true,
    retention: "none",
    grammarProvider: "openrouter",
    grammarConfigured: openRouterConfigured(),
  }));

  app.post("/v1/assist", async (request, reply) => {
    const parsed = assistDraftSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_draft" });
    assertCivicSafe(parsed.data);
    try {
      const corrected = await (options.correctGrammar ?? correctAlbanianGrammar)(parsed.data);
      return {
        original: parsed.data,
        suggestion: {
          title: corrected.title,
          problem: corrected.problem,
          proposedChange: corrected.proposedChange,
        },
        changes: corrected.changes,
        requiresApproval: true,
        retained: false,
        assisted: true,
        provider: "openrouter",
      };
    } catch (error) {
      if (error instanceof OpenRouterError && error.code === "not_configured")
        return reply.code(503).send({ error: "grammar_assistant_not_configured" });
      return reply.code(502).send({ error: "grammar_assistant_unavailable" });
    }
  });

  app.post("/v1/duplicates", async (request, reply) => {
    const parsed = duplicateSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_draft" });
    assertCivicSafe(parsed.data);
    const haystack = `${parsed.data.title} ${parsed.data.problem}`.toLocaleLowerCase("sq-AL");
    const proposals = await searchableProposals(options.civicApiUrl ?? process.env.CIVIC_API_URL);
    const inputTerms = terms(haystack);
    const suggestions = proposals
      .map((item) => {
        const proposalTerms = terms(`${item.title} ${item.problem ?? item.summary ?? ""}`);
        const overlap = proposalTerms.filter((term) => inputTerms.includes(term)).length;
        return {
          id: item.id,
          title: item.title,
          score: overlap / Math.max(3, Math.min(inputTerms.length, proposalTerms.length)),
        };
      })
      .filter((item) => item.score >= 0.25)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    return { suggestions, decision: "author_or_moderator", retained: false };
  });
  return app;
}
