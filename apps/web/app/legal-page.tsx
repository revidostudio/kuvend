import type { ReactNode } from "react";

export function LegalPage({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className="legal-page">
      <a className="brand" href="/" aria-label="Kuvend, kreu">
        <img src="/mark.svg" alt="" />
        <span>Kuvend</span>
      </a>
      <p className="eyebrow">I pavarur dhe joqeveritar</p>
      <h1>{title}</h1>
      <p className="legal-lead">{lead}</p>
      <div className="legal-content">{children}</div>
      <div className="legal-actions">
        <a href="/#propozimet">Shiko propozimet</a>
        <a href="/">Kthehu në krye</a>
      </div>
      <p className="legal-updated">Versioni beta · Përditësuar më 2 gusht 2026</p>
    </main>
  );
}
