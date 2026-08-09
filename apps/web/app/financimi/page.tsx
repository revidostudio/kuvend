import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Financimi — Kuvend",
  description: "Si financohet Kuvend dhe si ndahet mbështetja financiare nga ndikimi.",
  alternates: { canonical: "/financimi" },
};

export default function FundingPage() {
  return (
    <LegalPage
      title="Financimi"
      lead="Paratë mund të mbulojnë kosto, por nuk mund të blejnë renditje, moderim, rezultat ose akses te të dhënat."
    >
      <div className="trust-status">
        <strong>Regjistri publik i beta-s</strong>
        <p>
          Më 3 gusht 2026, faqja nuk liston sponsor financiar të jashtëm. Puna dhe infrastruktura e
          fazës themeluese trajtohen si kontribute të projektit derisa të publikohet një hyrje e
          veçantë këtu.
        </p>
      </div>
      <h2>Çfarë do të publikohet për çdo mbështetje</h2>
      <ul>
        <li>Emri i financuesit dhe shuma ose vlera e mbështetjes.</li>
        <li>Data, qëllimi, kohëzgjatja dhe çdo kusht i marrëveshjes.</li>
        <li>Kostot e paguara dhe çdo konflikt i mundshëm interesi.</li>
        <li>Kontributi i punës veçmas nga financimi.</li>
      </ul>
      <h2>Çfarë nuk pranohet</h2>
      <p>
        Pagesa për promovimin e një propozimi, ndikim mbi moderimin, akses te të dhënat, renditje e
        sponsorizuar, reklama dhe shitje informacioni për pjesëmarrësit.
      </p>
      <h2>Shpenzimet</h2>
      <p>
        Regjistri do të ndajë kostot e hosting-ut, verifikimeve WhatsApp, auditimeve, punës ligjore
        dhe shërbimeve të tjera. Vlerat nuk do të paraqiten si “zero” kur janë mbuluar si kontribut
        në natyrë.
      </p>
    </LegalPage>
  );
}
