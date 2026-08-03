import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Si funksionon — Kuvend",
  description: "Si propozohen, verifikohen, votohen dhe ndiqen çështjet në Kuvend.",
  alternates: { canonical: "/si-funksionon" },
};

export default function HowItWorksPage() {
  return (
    <LegalPage
      active="how"
      title="Si funksionon"
      lead="Mund të lexosh pa llogari. Verifikimi kërkohet vetëm kur propozon, argumenton ose voton."
    >
      <ol className="process-list">
        <li>
          <strong>Shkruaj propozimin</strong>
          <span>
            Shpjego problemin dhe ndryshimin. Ndihma AI është opsionale dhe nuk publikon pa miratim.
          </span>
        </li>
        <li>
          <strong>Verifiko kontrollin e telefonit</strong>
          <span>OTP krijon një dëshmi 30-ditore. Nuk provon identitet, shtetësi ose banim.</span>
        </li>
        <li>
          <strong>Kaloni moderimin</strong>
          <span>Kontrollohen siguria, privatësia, dublikatat dhe lidhja me politikën publike.</span>
        </li>
        <li id="votimi">
          <strong>Voto përfundimisht</strong>
          <span>
            Shikon pjesëmarrjen, zgjedh Mbështes ose Kundërshtoj dhe konfirmon vetëm një herë.
          </span>
        </li>
        <li>
          <strong>Ruaj mandatin</strong>
          <span>
            Mandati lejon kontrollin e përfshirjes së votës pa zbuluar telefonin ose zgjedhjen.
          </span>
        </li>
        <li>
          <strong>Ndiq përgjigjen</strong>
          <span>
            Rezultati publik i dërgohet institucionit dhe përgjigjja ose mungesa e saj regjistrohet.
          </span>
        </li>
      </ol>
      <h2>Pse nuk ka profil qytetar?</h2>
      <p>
        Një profil normal krijon histori dhe identifikues të qëndrueshëm. Kuvend përdor dëshmi të
        kufizuara dhe pseudonime për propozim që pjesëmarrja të mos bëhet një dosje aktiviteti.
      </p>
      <h2>Çfarë shikon publiku?</h2>
      <p>
        Propozimet, argumentet, provat, historiku, pjesëmarrja dhe rezultatet e mbyllura janë
        publike. Numrat e telefonit, OTP-të, dëshmitë dhe mandatet individuale nuk janë publike.
      </p>
    </LegalPage>
  );
}
