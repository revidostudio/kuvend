import type { Metadata } from "next";
import { KuvendApp } from "../../kuvend-app";
import { publicProposalPreviews } from "../../seo-data";

const civicUrl =
  process.env.CIVIC_API_URL ?? process.env.NEXT_PUBLIC_CIVIC_API_URL ?? "http://localhost:4000";

interface ProposalPreview {
  id: string;
  title: string;
  summary: string;
  pseudonym?: string;
  opensAt?: string;
  votingRound?: { opensAt: string; closesAt: string };
}

async function getProposal(id: string): Promise<ProposalPreview | undefined> {
  const local = publicProposalPreviews.find((proposal) => proposal.id === id) as
    ProposalPreview | undefined;
  try {
    const response = await fetch(`${civicUrl}/v1/proposals/${id}`, { next: { revalidate: 60 } });
    if (response.ok) return (await response.json()).proposal as ProposalPreview;
  } catch {}
  return local;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getProposal(id);
  if (!proposal) return { title: "Propozimi nuk u gjet — Kuvend", robots: { index: false } };
  const title = `${proposal.title} — Kuvend`;
  const description = `${proposal.summary} Votim kombëtar këshillues me pjesëmarrje të verifikuar me telefon.`;
  return {
    title,
    description,
    alternates: { canonical: `/propozime/${id}` },
    openGraph: { title, description, url: `/propozime/${id}`, type: "article", locale: "sq_AL" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = await getProposal(id);
  const structuredData = proposal
    ? {
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        headline: proposal.title,
        description: proposal.summary,
        url: `https://kuvend.org/propozime/${id}`,
        inLanguage: "sq-AL",
        author: { "@type": "Person", name: proposal.pseudonym ?? "Pjesëmarrës anonim" },
        ...(proposal.votingRound?.opensAt || proposal.opensAt
          ? { datePublished: proposal.votingRound?.opensAt ?? proposal.opensAt }
          : {}),
        isPartOf: { "@type": "WebSite", name: "Kuvend", url: "https://kuvend.org" },
      }
    : null;
  return (
    <>
      <KuvendApp initialSelectedId={id} />
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
