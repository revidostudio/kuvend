import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Kushtet e përdorimit — Kuvend",
  description: "Rregullat për përdorimin e platformës qytetare Kuvend.",
  alternates: {
    canonical: "/kushtet",
    languages: { sq: "/kushtet", en: "/en/terms" },
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Kushtet e përdorimit"
      lead="Kuvend është një hapësirë e pavarur për propozime dhe pjesëmarrje këshilluese, jo zgjedhje, referendum ose institucion shtetëror."
      alternate={{ href: "/en/terms", label: "Read these terms in English" }}
    >
      <aside className="trust-status" aria-label="Statusi i kushteve">
        <strong>Beta eksperimentale.</strong> Këto kushte zbatohen për pjesëmarrjen aktuale me
        WhatsApp dhe prova anonime. Ndryshimet materiale publikohen me datë dhe njoftim të dukshëm.
      </aside>

      <h2>1. Operatori dhe pranimi</h2>
      <p>
        Kuvend operohet nga Revido LLC, 2106 House, Ave Suite 383, Cheyenne, Wyoming 82001, SHBA.
        Duke dorëzuar propozim, argument ose votë, ti pranon këto kushte dhe{" "}
        <a href="/privatesia">Politikën e privatësisë</a>. Shfletimi publik nuk kërkon regjistrim.
      </p>
      <p>
        Kuvend është i pavarur dhe joqeveritar. Nuk është i lidhur me Kuvendin e Shqipërisë dhe nuk
        vepron në emër të një institucioni publik.
      </p>

      <h2>2. Kush mund të marrë pjesë</h2>
      <p>
        Mund të përdorësh një numër ndërkombëtar të mbështetur për të provuar kontrollin e
        telefonit. Ky kontroll nuk vërteton emrin, moshën, shtetësinë, banimin, veçantinë si person
        ose të drejtën zgjedhore. Duhet të jesh në gjendje t’i pranosh ligjërisht këto kushte; mos
        dorëzo të dhëna personale të një fëmije ose personi tjetër.
      </p>

      <h2>3. Kredencialet dhe veprimet</h2>
      <p>
        Kredenciali anonim, mandati i përfshirjes dhe sekreti i rikuperimit janë për përdorimin
        tënd. Mos i shit, mos i automatizo dhe mos i përdor për të anashkaluar kufizimet. Kuvend nuk
        mund të rikuperojë një sekret të humbur duke kërkuar identitetin tënd. Vota konfirmohet në
        një hap përfundimtar dhe nuk ndryshohet më pas.
      </p>

      <h2>4. Propozimet, argumentet dhe provat</h2>
      <p>
        Ti mbetesh përgjegjës për përmbajtjen që dorëzon dhe duhet të kesh të drejtë ta publikosh.
        Mos posto kërcënime, të dhëna personale të synuara, përmbajtje të paligjshme, mashtrim,
        imitim, spam ose materiale pa lidhje vepruese me politikën publike. Lidhja e një prove nuk
        do të thotë se Kuvend e miraton ose e ka verifikuar atë.
      </p>
      <p>
        Ti i jep Revido LLC një licencë joekskluzive, pa pagesë dhe mbarëbotërore për të ruajtur,
        moderuar, përkthyer, shfaqur, shpërndarë dhe arkivuar përmbajtjen vetëm aq sa duhet për
        operimin, auditimin dhe komunikimin publik të Kuvend. Ti mban të drejtat e tjera.
      </p>

      <h2>5. Moderimi dhe ankimet</h2>
      <p>
        Moderatorët kontrollojnë fushën, sigurinë, të dhënat personale dhe dublikatat. Mund të
        refuzojnë, fshehin ose heqin përmbajtje sipas{" "}
        <a href="/moderimi">rregullave të moderimit</a>. Vendimi jep arsyen dhe, kur ofrohet, mund
        të ankimohet përmes lidhjes private të aftësisë. Ankimet dhe heqjet me rrezik të lartë
        kërkojnë dy moderatorë.
      </p>

      <h2>6. Ndihma AI dhe shërbimet e jashtme</h2>
      <p>
        Ndihma AI është opsionale. Ajo mund të korrigjojë, thjeshtojë, transkriptojë, përkthejë ose
        sugjerojë dublikata, por nuk duhet të ndryshojë kuptimin politik, të shpikë fakte ose të
        marrë vendim moderimi. Ti miraton tekstin para publikimit. Veprimi “Hulumto” hap ChatGPT,
        Claude ose Google vetëm pasi e zgjedh; këto shërbime kanë kushtet dhe politikat e tyre.
      </p>

      <h2>7. Votimi dhe rezultatet</h2>
      <p>
        Propozimet e pranueshme hapen për 14 ditë dhe mbulojnë dy fundjava. Pjesëmarrja totale mund
        të shihet para votimit, por ndarja mbështes/kundërshtoj shfaqet vetëm pasi vota pranohet ose
        mbyllet raundi. Afati zgjatet vetëm për një ndërprerje materiale të dokumentuar.
      </p>
      <p>
        Rezultatet janë këshilluese, jo përfaqësuese dhe jo detyruese. Ato nuk janë zgjedhje ose
        sondazh shkencor. Revido LLC mund t’ia dërgojë rezultatin institucionit përkatës dhe të
        publikojë përgjigjen ose mungesën e saj.
      </p>

      <h2>8. Abuzimi, pezullimi dhe siguria</h2>
      <p>
        Nuk lejohet ndërhyrja në shërbim, testimi pa autorizim, automatizimi abuziv, pompimi i
        mesazheve, votimi i përsëritur, anashkalimi i kufijve ose tentativa për të lidhur
        kredenciale anonime me persona. Revido LLC mund të kufizojë një veprim, kredencial ose burim
        trafiku për siguri dhe integritet, me auditim dhe ankim kur është praktik.
      </p>

      <h2>9. Disponueshmëria dhe përgjegjësia</h2>
      <p>
        Beta ofrohet “siç është” dhe mund të ndryshojë, pezullohet ose përfundojë. Ne nuk garantojmë
        disponueshmëri të pandërprerë, dorëzim të çdo kodi, saktësi të përmbajtjes së përdoruesve
        ose përgjigje institucionale. Asgjë këtu nuk përjashton përgjegjësi ose të drejta që ligji
        nuk lejon të përjashtohen. Brenda kufirit ligjor, Revido LLC nuk përgjigjet për dëme të
        tërthorta ose vendime të marra duke u mbështetur vetëm te përmbajtja këshilluese e Kuvend.
      </p>

      <h2>10. Ligji, ndryshimet dhe kontakti</h2>
      <p>
        Këto kushte nuk kufizojnë të drejtat e detyrueshme që të takojnë sipas ligjit në fuqi.
        Çështjet e juridiksionit vlerësohen duke marrë parasysh operatorin amerikan, shërbimin në
        Shqipëri dhe mbrojtjet e detyrueshme të përdoruesve.
      </p>
      <p>
        Ndryshimet materiale publikohen me datë të re dhe njoftim të dukshëm. Për pyetje ligjore
        shkruaj te <a href="mailto:legal@kuvend.org">legal@kuvend.org</a>, për privatësinë te{" "}
        <a href="mailto:privacy@kuvend.org">privacy@kuvend.org</a> dhe për moderimin te{" "}
        <a href="mailto:moderation@kuvend.org">moderation@kuvend.org</a>.
      </p>
    </LegalPage>
  );
}
