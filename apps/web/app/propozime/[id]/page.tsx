import type { Metadata } from "next";
import { isPublicProposalStatus, type ProposalRecord } from "@kuvend/contracts";
import { KuvendApp } from "../../kuvend-app";
import { fallbackProposals } from "../../../features/kuvend/fallback-data";
import { publicProposalPreviews } from "../../seo-data";
import { extractProposalId, proposalPath, proposalSegment } from "../../proposal-url";

const civicUrl =
  process.env.CIVIC_API_URL ?? process.env.NEXT_PUBLIC_CIVIC_API_URL ?? "http://localhost:4000";

export function generateStaticParams() {
  return publicProposalPreviews.map((proposal) => ({ id: proposalSegment(proposal) }));
}

async function getProposal(id: string): Promise<ProposalRecord | undefined> {
  const local = fallbackProposals.find((proposal) => proposal.id === id);
  try {
    const response = await fetch(`${civicUrl}/v1/proposals/${id}`, { next: { revalidate: 60 } });
    if (response.ok) {
      const proposal = (await response.json()).proposal as ProposalRecord;
      if (isPublicProposalStatus(proposal.status)) return proposal;
    }
  } catch {}
  return local && isPublicProposalStatus(local.status) ? local : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const proposalId = extractProposalId(id);
  const proposal = await getProposal(proposalId);
  if (!proposal) return { title: "Propozimi nuk u gjet — Kuvend", robots: { index: false } };
  const title = `${proposal.title} — Kuvend`;
  const description = `${proposal.summary} Votim kombëtar këshillues me pjesëmarrje të verifikuar me telefon.`;
  return {
    title,
    description,
    alternates: { canonical: proposalPath(proposal) },
    openGraph: {
      title,
      description,
      url: proposalPath(proposal),
      type: "article",
      locale: "sq_AL",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposalId = extractProposalId(id);
  const proposal = await getProposal(proposalId);
  const structuredData = proposal
    ? {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        headline: proposal.title,
        description: proposal.summary,
        url: `https://kuvend.org${proposalPath(proposal)}`,
        inLanguage: "sq-AL",
        author: { "@type": "Person", name: proposal.pseudonym ?? "Pjesëmarrës anonim" },
        ...(proposal.votingRound?.opensAt ? { datePublished: proposal.votingRound.opensAt } : {}),
        isPartOf: { "@type": "WebSite", name: "Kuvend", url: "https://kuvend.org" },
      }
    : null;
  return (
    <>
      <KuvendApp
        initialSelectedId={proposalId}
        {...(proposal ? { initialProposal: proposal } : {})}
      />
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </>
  );
}
