import type { MetadataRoute } from "next";
import { publicProposalPreviews } from "./seo-data";

const civicUrl =
  process.env.CIVIC_API_URL ?? process.env.NEXT_PUBLIC_CIVIC_API_URL ?? "http://localhost:4000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let proposals: Array<{ id: string; opensAt?: string; votingRound?: { opensAt: string } }> = [
    ...publicProposalPreviews,
  ];
  try {
    const response = await fetch(`${civicUrl}/v1/proposals`, { next: { revalidate: 300 } });
    if (response.ok) proposals = (await response.json()).proposals;
  } catch {}
  return [
    { url: "https://kuvend.org", changeFrequency: "daily", priority: 1 },
    ...["privatesia", "kushtet", "moderimi", "transparenca"].map((path) => ({
      url: `https://kuvend.org/${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...proposals.map((proposal) => ({
      url: `https://kuvend.org/propozime/${proposal.id}`,
      lastModified: new Date(proposal.votingRound?.opensAt ?? proposal.opensAt ?? Date.now()),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
