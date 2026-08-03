import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Qendra e besimit — Kuvend",
  description: "Kush e ndërton Kuvend, si mbrohet pjesëmarrja dhe cilat janë kufijtë e beta-s.",
  alternates: { canonical: "/besimi" },
};

export default function TrustCenterPage() {
  return (
    <LegalPage
      title="Qendra e besimit"
      lead="Mos na beso vetëm nga fjalët. Këtu shpjegojmë kush e ndërton Kuvend, çfarë merr çdo shërbim dhe çfarë nuk është ende gati për pjesëmarrje sensitive."
    >
      <div className="trust-status" role="status">
        <strong>Statusi aktual: beta sintetike</strong>
        <p>
          Propozimet dhe dëshmitë e demonstrimit nuk janë një votim kombëtar real. Verifikimi i
          prodhimit dhe pretendimi i plotë i privatësisë mbeten të bllokuara deri te operatori dhe
          auditimi i pavarur.
        </p>
      </div>
      <div className="trust-directory">
        <a href="/rreth-kuvendit">
          <strong>Kush qëndron pas Kuvend</strong>
          <span>Pronësia, përgjegjësitë, pavarësia dhe kontaktet.</span>
        </a>
        <a href="/si-funksionon">
          <strong>Si funksionon pjesëmarrja</strong>
          <span>Nga propozimi dhe OTP-ja te vota, mandati dhe përgjigjja.</span>
        </a>
        <a href="/privatesia">
          <strong>Privatësia dhe telefoni</strong>
          <span>Çfarë merr verifikuesi dhe çfarë nuk merr shërbimi qytetar.</span>
        </a>
        <a href="/siguria">
          <strong>Siguria dhe raportimi</strong>
          <span>Mbrojtjet, kufijtë, incidentet dhe mënyra për të raportuar.</span>
        </a>
        <a href="/financimi">
          <strong>Financimi dhe ndikimi</strong>
          <span>Regjistri publik dhe rregulli që paratë nuk blejnë ndikim.</span>
        </a>
        <a href="/transparenca">
          <strong>Teknologjia dhe portat e nisjes</strong>
          <span>Kodi i hapur, operatorët dhe kushtet para një piloti real.</span>
        </a>
      </div>
      <h2>Kush merr çfarë?</h2>
      <div className="trust-boundaries">
        <section>
          <strong>Shërbimi i verifikimit</strong>
          <p>
            Merr përkohësisht numrin për OTP. Nuk merr propozimin, argumentin, zgjedhjen e votës ose
            faqen që po lexon.
          </p>
        </section>
        <section>
          <strong>Shërbimi qytetar</strong>
          <p>
            Merr përmbajtjen publike dhe provën anonime të pjesëmarrjes. Skema e tij refuzon numra
            telefoni, OTP dhe identifikues të qëndrueshëm qytetarësh.
          </p>
        </section>
        <section>
          <strong>Publiku</strong>
          <p>
            Sheh propozimet, provat, argumentet, historikun dhe rezultatet. Nuk sheh telefonin,
            dëshminë anonime ose mandatin individual.
          </p>
        </section>
      </div>
      <h2>Çfarë mund të kontrollosh vetë?</h2>
      <ul>
        <li>Kodin burimor, versionin e publikuar dhe kufijtë e deklaruar të beta-s.</li>
        <li>Arsyet dhe historikun publik të moderimit për çdo propozim.</li>
        <li>Përfshirjen e votës pas mbylljes, duke përdorur mandatin që ruan vetë.</li>
        <li>Financuesit, konfliktet e interesit dhe raportet e auditimit kur publikohen.</li>
      </ul>
      <h2>Premtimet që mund të kontrollohen</h2>
      <ul>
        <li>Nuk ka reklama, shitje të të dhënave ose renditje të sponsorizuar.</li>
        <li>Rezultatet quhen këshilluese dhe jo përfaqësuese.</li>
        <li>Shërbimi qytetar refuzon fusha telefoni dhe identifikues të qëndrueshëm.</li>
        <li>Vendimet e moderimit kanë arsye dhe rrugë apelimi.</li>
        <li>Kufizimet e beta-s shfaqen aty ku propozon, verifikon dhe voton.</li>
      </ul>
    </LegalPage>
  );
}
