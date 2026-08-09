import type { ReactNode } from "react";
import { PublicSiteFooter, PublicSiteHeader, type PublicNavigationSection } from "@kuvend/ui";

export function LegalPage({
  title,
  lead,
  children,
  active = "trust",
  locale = "sq",
  alternate,
  updated = "9 gusht 2026",
}: {
  title: string;
  lead: string;
  children: ReactNode;
  active?: PublicNavigationSection;
  locale?: "sq" | "en";
  alternate?: { href: string; label: string };
  updated?: string;
}) {
  const english = locale === "en";

  return (
    <>
      <PublicSiteHeader active={active} />
      <main className="legal-page" lang={locale}>
        <p className="eyebrow">
          {english ? "Independent and non-governmental" : "I pavarur dhe joqeveritar"}
        </p>
        <h1>{title}</h1>
        <p className="legal-lead">{lead}</p>
        {alternate ? (
          <p>
            <a className="trust-link" href={alternate.href} hrefLang={english ? "sq" : "en"}>
              {alternate.label}
            </a>
          </p>
        ) : null}
        <div className="legal-content">{children}</div>
        <div className="legal-actions">
          <a href="/#propozimet">{english ? "View proposals" : "Shiko propozimet"}</a>
          <a href="/">{english ? "Back to home" : "Kthehu në krye"}</a>
        </div>
        <p className="legal-updated">
          {english
            ? `Beta version · Updated ${updated}`
            : `Versioni beta · Përditësuar më ${updated}`}
        </p>
      </main>
      <PublicSiteFooter />
    </>
  );
}
