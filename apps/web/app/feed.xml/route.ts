import { proposalPath } from "../proposal-url";

const civicUrl =
  process.env.CIVIC_API_URL ?? process.env.NEXT_PUBLIC_CIVIC_API_URL ?? "http://localhost:4000";
const escapeXml = (value: string) =>
  value.replace(
    /[<>&'\"]/g,
    (character) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]!,
  );

export async function GET() {
  let proposals: Array<{
    id: string;
    title: string;
    summary: string;
    opensAt?: string;
    status?: string;
    votingRound?: { opensAt: string };
  }> = [];
  try {
    const response = await fetch(`${civicUrl}/v1/proposals`, { next: { revalidate: 300 } });
    if (response.ok) proposals = (await response.json()).proposals;
  } catch {}
  const items = proposals
    .filter((proposal) => !proposal.status || proposal.status === "voting_open")
    .map(
      (proposal) =>
        `<item><title>${escapeXml(proposal.title)}</title><link>https://kuvend.org${proposalPath(proposal)}</link><guid>https://kuvend.org${proposalPath(proposal)}</guid><description>${escapeXml(proposal.summary)}</description><pubDate>${new Date(proposal.votingRound?.opensAt ?? proposal.opensAt ?? Date.now()).toUTCString()}</pubDate></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Kuvend — Propozimet në votim</title><link>https://kuvend.org</link><description>Propozime të reja në votim këshillues për Shqipërinë.</description><language>sq-AL</language>${items}</channel></rss>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
