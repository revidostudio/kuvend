import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Rregullat e moderimit — Kuvend",
  alternates: { canonical: "/moderimi" },
};

export default function ModerationPage() {
  return (
    <LegalPage
      title="Rregullat e moderimit"
      lead="Moderimi kontrollon pranueshmërinë dhe sigurinë; nuk zgjedh cilat ide politike meriton të mbështeten."
    >
      <h2>Pranohet</h2>
      <p>
        Një propozim duhet të përshkruajë një problem publik, një ndryshim të zbatueshëm dhe fushën
        gjeografike. Mospajtimi politik nuk është arsye për heqje.
      </p>
      <h2>Nuk pranohet</h2>
      <p>
        Kërcënimet, të dhënat personale të synuara, përmbajtja e paligjshme, imitimi, mashtrimi,
        spam-i dhe temat pa lidhje të zbatueshme me politikën publike. Dublikatat lidhen me
        propozimin kryesor dhe nuk bashkohen në heshtje.
      </p>
      <h2>Vendimet dhe apelimi</h2>
      <p>
        Synojmë shqyrtim brenda 72 orësh. Çdo refuzim ose dublikatë ka arsye publike. Vendimet me
        rrezik të lartë dhe apelet kërkojnë dy moderatorë të ndryshëm që konfirmojnë të njëjtin
        vendim. Autori apelon me sekretin privat të rikuperimit.
      </p>
      <hr />
      <h2>English summary</h2>
      <p>
        Moderation checks scope, safety, personal data, impersonation, spam, legality, and
        duplication—not political popularity. Rejections, duplicate decisions, and appeals require
        two distinct reviewers. Authors appeal through an unlinkable recovery capability.
      </p>
    </LegalPage>
  );
}
