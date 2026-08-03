import { describe, expect, it } from "vitest";
import {
  buildGoogleSearchUrl,
  buildResearchDeepLink,
  buildResearchPrompt,
  MAX_RESEARCH_PROMPT_LENGTH,
  normalizePublicResearchProposal,
} from "./external-research";

const proposal = {
  title: "Më shumë hije në stacionet e autobusëve",
  problem: "Udhëtarët presin gjatë në diell dhe pa strehë gjatë muajve të verës.",
  proposedChange: "Bashkitë të vendosin strehë, hije dhe informacion për linjat.",
  scope: "Kombëtar",
  location: "Shqipëri",
  category: "Transport",
  evidence: [
    {
      type: "source",
      title: "Studimi për transportin publik",
      publisher: "Instituti i Transportit",
      url: "https://example.org/studimi",
    },
  ],
  canonicalUrl:
    "https://kuvend.org/propozime/me-shume-hije-ne-stacionet-e-autobuseve-11111111-1111-4111-8111-111111111111",
};

describe("external research", () => {
  it("builds a neutral Albanian prompt with public evidence and canonical link", () => {
    const prompt = buildResearchPrompt(proposal);
    expect(prompt).toContain("Mos e trajto asnjë pretendim si fakt pa e kontrolluar.");
    expect(prompt).toContain("Më shumë hije në stacionet e autobusëve");
    expect(prompt).toContain("https://example.org/studimi");
    expect(prompt).toContain(proposal.canonicalUrl);
    expect(prompt.length).toBeLessThanOrEqual(MAX_RESEARCH_PROMPT_LENGTH);
  });

  it("preserves Albanian characters in the decoded Google query", () => {
    const url = new URL(buildGoogleSearchUrl(proposal));
    expect(url.origin).toBe("https://www.google.com");
    expect(url.searchParams.get("q")).toContain("Më shumë hije");
    expect(url.searchParams.get("q")).toContain("Shqipëri");
    expect(url.searchParams.get("q")).toContain("dokument publik");
  });

  it.each(["chatgpt", "claude"] as const)(
    "builds a bounded direct %s link with the neutral prompt and canonical URL",
    (provider) => {
      const url = new URL(buildResearchDeepLink(provider, proposal));
      expect(url.origin).toBe(provider === "chatgpt" ? "https://chatgpt.com" : "https://claude.ai");
      expect(url.searchParams.get("q")).toContain("Mos e trajto asnjë pretendim si fakt");
      expect(url.searchParams.get("q")).toContain(proposal.canonicalUrl);
      expect(url.searchParams.get("q")!.length).toBeLessThanOrEqual(1_800);
    },
  );

  it("allows only HTTPS canonical links outside local development", () => {
    expect(() =>
      normalizePublicResearchProposal({ ...proposal, canonicalUrl: "http://kuvend.org/propozimi" }),
    ).toThrow(/HTTPS/);
    expect(() =>
      normalizePublicResearchProposal({ ...proposal, canonicalUrl: "http://127.0.0.1:3000/test" }),
    ).not.toThrow();
  });

  it.each(["phone", "otp", "credential", "receipt", "capabilitySecret", "nullifier", "vote"])(
    "rejects the forbidden field %s",
    (field) => {
      expect(() => normalizePublicResearchProposal({ ...proposal, [field]: "private" })).toThrow(
        /fusha të palejuara/,
      );
    },
  );

  it("rejects private or untracked fields inside evidence", () => {
    expect(() =>
      normalizePublicResearchProposal({
        ...proposal,
        evidence: [{ ...proposal.evidence[0], traceId: "stable-id" }],
      }),
    ).toThrow(/fusha të palejuara/);
  });

  it("caps the evidence list and long proposal text deterministically", () => {
    const prompt = buildResearchPrompt({
      ...proposal,
      problem: "ë".repeat(8_000),
      proposedChange: "ç".repeat(8_000),
      evidence: Array.from({ length: 8 }, (_, index) => ({
        ...proposal.evidence[0],
        title: `Burimi ${index + 1}`,
        url: `https://example.org/${index + 1}`,
      })),
    });
    expect(prompt.length).toBeLessThanOrEqual(MAX_RESEARCH_PROMPT_LENGTH);
    expect(prompt).toContain("Burimi 5");
    expect(prompt).not.toContain("Burimi 6");
  });
});
