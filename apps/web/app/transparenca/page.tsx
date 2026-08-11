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
        krahasohen me listën e angazhimeve pas mbylljes. Metadata ka nënshkrim integriteti; kjo nuk
        zëvendëson auditimin e pavarur.
      </p>
      <h2>Portat e nisjes</h2>
      <p>
        Beta përdor Semaphore V4 dhe WhatsApp OTP. Para pretendimeve më të forta të anonimitetit,
        Kuvend kërkon operator të pavarur të lëshuesit, vlerësim ligjor dhe të ndikimit, kontroll
        prodhimi nga dy persona dhe auditime të publikuara pa gjetje kritike ose të larta.
      </p>
      <h2>Statusi i deklaratave</h2>
      <p>
        Beta aktuale pranon pjesëmarrje këshilluese. Ajo nuk pretendon operator të pavarur të
        lëshuesit, anonimitet të audituar ose përfaqësim kombëtar. Shiko{" "}
        <a href="/besimi">Qendrën e besimit</a> për një përmbledhje të këtyre kufijve.
      </p>
      <p>
        Raportim sigurie: <a href="mailto:security@kuvend.org">security@kuvend.org</a>. Moderim:{" "}
        <a href="mailto:moderation@kuvend.org">moderation@kuvend.org</a>.
      </p>
      <hr />
      <h2>English summary</h2>
      <p>
        Kuvend is independent, non-governmental, noncommercial, and open source. The experimental
        beta uses real WhatsApp verification and Semaphore V4 proofs. Stronger anonymity claims
        require independent operation, legal assessment, two-person control, and published audits.
      </p>
    </LegalPage>
  );
}
