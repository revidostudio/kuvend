import { ImageResponse } from "next/og";
import { publicProposalPreviews } from "../../seo-data";

export const alt = "Propozim në Kuvend";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const civicUrl =
  process.env.CIVIC_API_URL ?? process.env.NEXT_PUBLIC_CIVIC_API_URL ?? "http://localhost:4000";

export default async function ProposalOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let proposal = publicProposalPreviews.find((item) => item.id === id) as
    { title: string; summary: string } | undefined;
  try {
    const response = await fetch(`${civicUrl}/v1/proposals/${id}`, { next: { revalidate: 300 } });
    if (response.ok) proposal = (await response.json()).proposal;
  } catch {}
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 70,
        color: "#001b44",
        background: "#fbfaf7",
        borderTop: "18px solid #d71920",
        fontFamily: "Arial",
      }}
    >
      <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>
        Kuvend · Propozim qytetar
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 1020 }}>
        <div style={{ display: "flex", fontSize: 64, lineHeight: 1.08, fontWeight: 800 }}>
          {proposal?.title ?? "Propozimi nuk u gjet"}
        </div>
        {proposal?.summary && (
          <div style={{ display: "flex", marginTop: 24, fontSize: 27, color: "#52647b" }}>
            {proposal.summary.slice(0, 180)}
          </div>
        )}
      </div>
      <div style={{ display: "flex", fontSize: 20, color: "#52647b" }}>
        I pavarur dhe joqeveritar · Rezultat këshillues · kuvend.org
      </div>
    </div>,
    size,
  );
}
