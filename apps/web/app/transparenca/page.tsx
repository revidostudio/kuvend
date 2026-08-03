import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Transparenca — Kuvend",
  alternates: { canonical: "/transparenca" },
};

export default function TransparencyPage() {
  return (
    <LegalPage
      title="Transparenca"
      lead="Kuvend është i pavarur, joqeveritar dhe jokomercial. Kodi, kufizimet dhe vendimet e politikave publikohen."
    >
      <h2>Pronësia dhe financimi</h2>
      <p>
        Nuk ka reklama, shitje të dhënash, pagesa për ndikim ose renditje të sponsorizuar.
        Mbështetja financiare mbulon vetëm kostot e përbashkëta dhe duhet të publikohet veçmas nga
        kontributi i punës. Shiko <a href="/rreth-kuvendit">kush mban përgjegjësi</a> dhe{" "}
        <a href="/financimi">regjistrin e financimit</a>.
      </p>
      <h2>Teknologjia</h2>
      <p>
        <a href="https://github.com/revidostudio/kuvend">Kodi burimor</a> përfshin kufijtë e
        shërbimeve, skemat, testet e privatësisë dhe dokumentet e arkitekturës. Mandatet e votave
        krahasohen me listën e nënshkruar pas mbylljes. Nënshkrimi në beta është sintetik dhe nuk
        përbën auditim.
      </p>
      <h2>Portat e nisjes</h2>
      <p>
        Pjesëmarrja sensitive nuk nis pa operator të pavarur të lëshuesit, protokoll të zgjedhur nga
        kriptografë të pavarur, vlerësim ligjor dhe të ndikimit, tre mirëmbajtës, miratim prodhimi
        nga dy persona dhe auditime të publikuara pa gjetje kritike ose të larta.
      </p>
      <h2>Statusi i deklaratave</h2>
      <p>
        Beta aktuale demonstron ndarjen e skemave dhe rrjedhën e produktit. Ajo nuk pretendon
        operator të pavarur të lëshuesit, anonimitet të audituar ose përfaqësim kombëtar. Shiko{" "}
        <a href="/besimi">Qendrën e besimit</a> për një përmbledhje të këtyre kufijve.
      </p>
      <p>
        Raportim sigurie: <a href="mailto:security@kuvend.org">security@kuvend.org</a>. Moderim:{" "}
        <a href="mailto:moderation@kuvend.org">moderation@kuvend.org</a>.
      </p>
      <hr />
      <h2>English summary</h2>
      <p>
        Kuvend is independent, non-governmental, noncommercial, and open source. Sensitive launch is
        blocked until independent operation, protocol selection, legal assessment, two-person
        production control, and published external audits are complete.
      </p>
    </LegalPage>
  );
}
