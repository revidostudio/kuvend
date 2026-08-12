import type { MetadataRoute } from "next";
import { isPublicProposalStatus, type ProposalStatus } from "@kuvend/contracts";
import { proposalPath } from "./proposal-url";

const civicUrl =
  process.env.CIVIC_API_URL ?? process.env.NEXT_PUBLIC_CIVIC_API_URL ?? "http://localhost:4000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let proposals: Array<{
    id: string;
    title: string;
    opensAt?: string;
    status?: ProposalStatus;
    votingRound?: { opensAt: string };
  }> = [];
  try {
    const response = await fetch(`${civicUrl}/v1/proposals`, { next: { revalidate: 300 } });
    if (response.ok) proposals = (await response.json()).proposals;
  } catch {}
  return [
    { url: "https://kuvend.org", changeFrequency: "daily", priority: 1 },
    ...[
      "besimi",
      "rreth-kuvendit",
      "si-funksionon",
      "privatesia",
      "siguria",
      "financimi",
      "kushtet",
      "moderimi",
      "transparenca",
      "en/privacy",
      "en/terms",
    ].map((path) => ({
      url: `https://kuvend.org/${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...proposals
      .filter((proposal) => !proposal.status || isPublicProposalStatus(proposal.status))
      .map((proposal) => ({
        url: `https://kuvend.org${proposalPath(proposal)}`,
        lastModified: new Date(proposal.votingRound?.opensAt ?? proposal.opensAt ?? Date.now()),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
  ];
}
