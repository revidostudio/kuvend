import type { EvidenceItem } from "@kuvend/contracts";

export const MAX_RESEARCH_PROMPT_LENGTH = 6_000;
export const MAX_DEEP_LINK_PROMPT_LENGTH = 1_800;
const MAX_EVIDENCE_ITEMS = 5;

export type ResearchProviderId = "chatgpt" | "claude" | "google";

export const researchProviders = [
  {
    id: "chatgpt",
    label: "Pyet ChatGPT",
    description: "Hap një bisedë të re me pyetjen neutrale të gatshme.",
    icon: "chatgpt",
    url: "https://chatgpt.com/",
    enabled: true,
  },
  {
    id: "claude",
    label: "Pyet Claude",
    description: "Hap një bisedë të re me pyetjen neutrale të gatshme.",
    icon: "claude",
    url: "https://claude.ai/new",
    enabled: true,
  },
  {
    id: "google",
    label: "Kërko në Google",
    description: "Kërkon burime, raporte dhe dokumente publike të lidhura.",
    icon: "google",
    url: "https://www.google.com/search",
    enabled: true,
  },
] as const;

type PublicEvidence = Pick<EvidenceItem, "type" | "url" | "title" | "publisher" | "publishedAt">;

export type PublicResearchProposal = {
  title: string;
  problem: string;
  proposedChange: string;
  scope: string;
  location?: string;
  category: string;
  evidence: PublicEvidence[];
  canonicalUrl: string;
};

const proposalKeys = new Set([
  "title",
  "problem",
  "proposedChange",
  "scope",
  "location",
  "category",
  "evidence",
  "canonicalUrl",
]);
const evidenceKeys = new Set(["type", "url", "title", "publisher", "publishedAt"]);

function assertExactKeys(value: Record<string, unknown>, allowed: Set<string>, label: string) {
  const unexpected = Object.keys(value).filter((key) => !allowed.has(key));
  if (unexpected.length > 0)
    throw new Error(`${label} përmban fusha të palejuara: ${unexpected.join(", ")}`);
}

function requiredText(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} duhet të jetë tekst publik.`);
  }
  return value.trim();
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function normalizePublicResearchProposal(input: unknown): PublicResearchProposal {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Propozimi publik nuk është i vlefshëm.");
  }
  const record = input as Record<string, unknown>;
  assertExactKeys(record, proposalKeys, "Propozimi");
  if (!Array.isArray(record.evidence)) throw new Error("Provat publike duhet të jenë një listë.");

  const evidence = record.evidence.slice(0, MAX_EVIDENCE_ITEMS).map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Prova ${index + 1} nuk është e vlefshme.`);
    }
    const evidenceRecord = item as Record<string, unknown>;
    assertExactKeys(evidenceRecord, evidenceKeys, `Prova ${index + 1}`);
    const url = requiredText(evidenceRecord.url, `Lidhja e provës ${index + 1}`);
    const publisher = optionalText(evidenceRecord.publisher);
    const publishedAt = optionalText(evidenceRecord.publishedAt);
    if (!url.startsWith("https://")) throw new Error("Lidhjet e provave duhet të përdorin HTTPS.");
    return {
      type: requiredText(
        evidenceRecord.type,
        `Lloji i provës ${index + 1}`,
      ) as EvidenceItem["type"],
      url,
      title: requiredText(evidenceRecord.title, `Titulli i provës ${index + 1}`),
      ...(publisher ? { publisher } : {}),
      ...(publishedAt ? { publishedAt } : {}),
    };
  });

  const canonicalUrl = requiredText(record.canonicalUrl, "Lidhja kanonike");
  const location = optionalText(record.location);
  const parsedCanonicalUrl = new URL(canonicalUrl);
  const localDevelopmentUrl =
    parsedCanonicalUrl.protocol === "http:" &&
    ["localhost", "127.0.0.1", "::1"].includes(parsedCanonicalUrl.hostname);
  if (parsedCanonicalUrl.protocol !== "https:" && !localDevelopmentUrl) {
    throw new Error("Lidhja kanonike duhet të jetë publike dhe HTTPS.");
  }

  return {
    title: requiredText(record.title, "Titulli"),
    problem: requiredText(record.problem, "Problemi"),
    proposedChange: requiredText(record.proposedChange, "Ndryshimi i propozuar"),
    scope: requiredText(record.scope, "Fusha"),
    ...(location ? { location } : {}),
    category: requiredText(record.category, "Kategoria"),
    evidence,
    canonicalUrl,
  };
}

function clip(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).trimEnd()}…`;
}

export function buildResearchPrompt(input: unknown) {
  const proposal = normalizePublicResearchProposal(input);
  const evidence = proposal.evidence.length
    ? proposal.evidence
        .map((item, index) => {
          const publisher = item.publisher ? ` — ${clip(item.publisher, 100)}` : "";
          return `${index + 1}. ${clip(item.title, 160)}${publisher}: ${clip(item.url, 500)}`;
        })
        .join("\n")
    : "Nuk janë publikuar ende prova të strukturuara.";

  const prompt = `Analizo në mënyrë neutrale këtë propozim qytetar për Shqipërinë.

Ndaji qartë:
1. pretendimet që bën propozimi;
2. çfarë mbështetet nga provat e publikuara;
3. cilat prova ose të dhëna mungojnë;
4. kundërargumentet dhe kompromiset kryesore;
5. institucionet që mund të jenë përgjegjëse;
6. pyetjet që duhen verifikuar më tej.

Mos e trajto asnjë pretendim si fakt pa e kontrolluar. Për çdo përfundim faktik jep burimin dhe lidhjen. Dallo analizën tënde nga përmbajtja e vetë propozimit.

Titulli: ${clip(proposal.title, 140)}
Kategoria: ${clip(proposal.category, 80)}
Fusha: ${clip(proposal.scope, 80)}${proposal.location ? ` — ${clip(proposal.location, 120)}` : ""}

Problemi i deklaruar:
${clip(proposal.problem, 1_500)}

Ndryshimi i propozuar:
${clip(proposal.proposedChange, 1_500)}

Provat dhe burimet publike:
${evidence}

Faqja kanonike e propozimit:
${clip(proposal.canonicalUrl, 500)}`;

  return clip(prompt, MAX_RESEARCH_PROMPT_LENGTH);
}

export function buildGoogleSearchUrl(input: unknown) {
  const proposal = normalizePublicResearchProposal(input);
  const query = [
    clip(proposal.title, 140),
    clip(proposal.category, 80),
    proposal.location ? clip(proposal.location, 120) : "Shqipëri",
    "raport studim ligj dokument publik",
  ].join(" ");
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function buildResearchDeepLink(providerId: "chatgpt" | "claude", input: unknown) {
  const proposal = normalizePublicResearchProposal(input);
  const canonicalSuffix = `\n\nLista e plotë e provave: ${proposal.canonicalUrl}`;
  const prompt = `${clip(
    buildResearchPrompt(proposal),
    MAX_DEEP_LINK_PROMPT_LENGTH - canonicalSuffix.length,
  )}${canonicalSuffix}`;
  const baseUrl = providerId === "chatgpt" ? "https://chatgpt.com/" : "https://claude.ai/new";
  const url = new URL(baseUrl);
  url.searchParams.set("q", prompt);
  return url.toString();
}

export function openExternalResearchUrl(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer external nofollow";
  link.referrerPolicy = "no-referrer";
  link.click();
}
