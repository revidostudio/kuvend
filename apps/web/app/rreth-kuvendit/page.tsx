import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Kush qëndron pas Kuvend — Kuvend",
  description: "Pronësia, pavarësia dhe përgjegjësitë e projektit Kuvend.",
  alternates: { canonical: "/rreth-kuvendit" },
};

export default function AboutPage() {
  return (
    <LegalPage
      title="Kush qëndron pas Kuvend"
      lead="Kuvend është një projekt i pavarur, jokomercial dhe me kod të hapur, i zhvilluar në fazën themeluese nga kontribuesit e Revido Studio."
    >
      <h2>Çfarë nuk jemi</h2>
      <p>
        Nuk jemi Kuvendi i Shqipërisë, institucion shtetëror, parti politike, organizatë zgjedhore
        ose përfaqësues i qytetarëve. Emri përshkruan një hapësirë diskutimi; nuk pretendon
        autoritet publik.
      </p>
      <h2>Kush mban përgjegjësi sot</h2>
      <p>
        Repository, produkti dhe dokumentacioni mirëmbahen publikisht nga organizata GitHub{" "}
        <a href="https://github.com/revidostudio/kuvend">revidostudio/kuvend</a>. Faza aktuale është
        themeluese dhe operatori i pavarur i verifikimit nuk është emëruar ende. Kjo është arsyeja
        pse Kuvend nuk bën ende pretendimin përfundimtar “ne nuk mund ta shohim numrin”.
      </p>
      <h2>Si merren vendimet</h2>
      <p>
        Ndryshimet e produktit, privatësisë dhe moderimit dokumentohen në kod dhe politika. Vendimet
        sensitive të moderimit kërkojnë dy shqyrtues. Para një piloti real, publikimet në prodhim
        duhet të kërkojnë dy persona dhe shërbimi i verifikimit duhet të kontrollohet nga një
        organizatë e pavarur.
      </p>
      <h2>Na kontakto</h2>
      <ul>
        <li>
          Privatësi: <a href="mailto:privacy@kuvend.org">privacy@kuvend.org</a>
        </li>
        <li>
          Siguri: <a href="mailto:security@kuvend.org">security@kuvend.org</a>
        </li>
        <li>
          Moderim: <a href="mailto:moderation@kuvend.org">moderation@kuvend.org</a>
        </li>
      </ul>
    </LegalPage>
  );
}
