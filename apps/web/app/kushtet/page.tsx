import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Kushtet e përdorimit — Kuvend",
  alternates: { canonical: "/kushtet" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Kushtet e përdorimit"
      lead="Kuvend është një hapësirë e pavarur për propozime dhe pjesëmarrje këshilluese, jo një zgjedhje ose institucion shtetëror."
    >
      <h2>Pjesëmarrja</h2>
      <p>
        Mund të shfletosh pa regjistrim. Dorëzimi, argumentimi dhe votimi kërkojnë një dëshmi të
        vlefshme të kontrollit të telefonit. Votat janë përfundimtare. Një numër ndërkombëtar
        pranohet, por nuk vërteton identitet, shtetësi ose banim.
      </p>
      <h2>Përgjegjësia për përmbajtjen</h2>
      <p>
        Publiko vetëm përmbajtje që ke të drejtë ta shpërndash. Lidhjet e provave janë përgjegjësi e
        kontribuesit; prania e tyre nuk do të thotë se Kuvend i miraton. Emrat e dhënë nga autorët
        shënohen si të paverifikuar.
      </p>
      <h2>Disponueshmëria dhe rezultatet</h2>
      <p>
        Beta mund të ndryshojë ose të ndërpritet. Rezultatet nuk janë përfaqësuese ose ligjërisht
        detyruese. Periudha 14-ditore zgjatet vetëm për një ndërprerje materiale të dokumentuar.
      </p>
      <hr />
      <h2>English summary</h2>
      <p>
        Kuvend is an independent advisory participation service, not an election or government body.
        Votes are final. Participants remain responsible for submitted content and evidence links.
        Availability is not guaranteed during beta, and all outcomes are non-binding and
        non-representative.
      </p>
    </LegalPage>
  );
}
