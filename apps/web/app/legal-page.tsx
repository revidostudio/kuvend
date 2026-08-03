import type { ReactNode } from "react";
import { PublicSiteFooter, PublicSiteHeader, type PublicNavigationSection } from "@kuvend/ui";

export function LegalPage({
  title,
  lead,
  children,
  active = "trust",
}: {
  title: string;
  lead: string;
  children: ReactNode;
  active?: PublicNavigationSection;
}) {
  return (
    <>
      <PublicSiteHeader active={active} />
      <main className="legal-page">
        <p className="eyebrow">I pavarur dhe joqeveritar</p>
        <h1>{title}</h1>
        <p className="legal-lead">{lead}</p>
        <div className="legal-content">{children}</div>
        <div className="legal-actions">
          <a href="/#propozimet">Shiko propozimet</a>
          <a href="/">Kthehu në krye</a>
        </div>
        <p className="legal-updated">Versioni beta · Përditësuar më 3 gusht 2026</p>
      </main>
      <PublicSiteFooter />
    </>
  );
}
