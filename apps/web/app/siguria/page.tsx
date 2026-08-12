import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Siguria — Kuvend",
  description: "Mbrojtjet, kufijtë dhe raportimi i sigurisë në Kuvend.",
  alternates: { canonical: "/siguria" },
};

export default function SecurityPage() {
  return (
    <LegalPage
      title="Siguria"
      lead="Siguria nuk është një simbol dryni. Ajo varet nga ndarja e shërbimeve, kufijtë e të dhënave, kontrolli i aksesit dhe verifikimi i pavarur."
    >
      <h2>Çfarë mbrohet në kod</h2>
      <ul>
        <li>API-ja qytetare refuzon numra telefoni, OTP dhe identifikues qytetarë.</li>
        <li>Verifikimi, pjesëmarrja dhe administrimi përdorin kufij të veçantë të dhënash.</li>
        <li>Votat përdorin shenja të kufizuara për propozim për të ndaluar përsëritjen.</li>
        <li>Administrimi kërkon akses të veçantë dhe krijon gjurmë auditimi.</li>
        <li>Testet skanojnë payload-et, databazat dhe log-et për fusha të ndaluara.</li>
      </ul>
      <h2>Çfarë nuk garantohet ende</h2>
      <p>
        Beta përdor Semaphore V4, por integrimi i plotë nuk është miratuar ende nga kriptograf i
        pavarur dhe nuk ka operator të jashtëm të lëshuesit ose relay të pavarur. Një pajisje e
        komprometuar, analiza e stilit të shkrimit ose bashkëpunimi i disa operatorëve mund të
        krijojë rreziqe jashtë mbrojtjeve të aplikacionit.
      </p>
      <h2>Raporto një problem</h2>
      <p>
        Dërgo një përshkrim te <a href="mailto:security@kuvend.org">security@kuvend.org</a>. Mos
        përfshi numra telefoni, OTP, dëshmi ose të dhëna personale të pjesëmarrësve. Problemet që
        rrezikojnë njerëzit trajtohen para publikimit të detajeve.
      </p>
      <h2>Nëse ndodh një incident</h2>
      <p>
        Prurjet e prekura ndalohen, çelësat rrotullohen, kufijtë kontrollohen dhe njoftimi publik
        përshkruan çfarë ndodhi, çfarë të dhënash mund të jenë prekur dhe çfarë duhet të bëjnë
        pjesëmarrësit.
      </p>
    </LegalPage>
  );
}
