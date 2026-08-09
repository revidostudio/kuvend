import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Politika e privatësisë — Kuvend",
  description: "Si Revido LLC dhe Kuvend përpunojnë, ndajnë dhe mbrojnë të dhënat.",
  alternates: {
    canonical: "/privatesia",
    languages: { sq: "/privatesia", en: "/en/privacy" },
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Politika e privatësisë"
      lead="Kuvend minimizon të dhënat personale dhe ndan verifikimin e telefonit nga propozimet, argumentet dhe votat."
      alternate={{ href: "/en/privacy", label: "Read this policy in English" }}
    >
      <aside className="trust-status" aria-label="Statusi i politikës">
        <strong>Draft për shqyrtim ligjor.</strong> Kjo politikë përshkruan beta-n sintetike dhe
        arkitekturën e planifikuar. Verifikimi real me WhatsApp nuk aktivizohet derisa vlerësimi i
        ndikimit, marrëveshjet me përpunuesit dhe shqyrtimi ligjor të jenë miratuar.
      </aside>

      <h2>1. Kush është përgjegjës</h2>
      <p>
        Revido LLC, 2106 House, Ave Suite 383, Cheyenne, Wyoming 82001, SHBA, është operatori dhe
        kontrolluesi i Kuvend. Kuvend është një projekt i pavarur, joqeveritar dhe nuk është i
        lidhur me Kuvendin e Shqipërisë ose me ndonjë institucion shtetëror.
      </p>
      <p>
        Për privatësinë dhe ushtrimin e të drejtave shkruaj te{" "}
        <a href="mailto:privacy@kuvend.org">privacy@kuvend.org</a>. Për çështje sigurie shkruaj te{" "}
        <a href="mailto:security@kuvend.org">security@kuvend.org</a>.
      </p>

      <h2 id="si-mbrohet-vota">Si mbrohet vota pa emër</h2>
      <p>
        Shërbimi i izoluar i verifikimit merr përkohësisht numrin, kërkon kodin njëpërdorimësh dhe
        lëshon një kredencial anonim. Shërbimi qytetar merr vetëm provën kriptografike dhe një
        shenjë unike për veprimin ose propozimin. Skema e tij refuzon numra telefoni, OTP, sesione
        identiteti dhe identifikues të qëndrueshëm të pjesëmarrësit.
      </p>
      <p>
        Në një provë reale me WhatsApp, Sent përdor dërguesin e vet të menaxhuar dhe, bashkë me
        WhatsApp/Meta, përpunon numrin dhe të dhënat e dërgesës. Sent dhe Meta nuk marrin tekstin e
        propozimit, votën, argumentet, mandatet e përfshirjes ose sekretet e rikuperimit. Gjatë
        beta-s, operatori i shërbimit të verifikimit nuk është ende i pavarur; prandaj Kuvend nuk
        pretendon se mirëmbajtësit teknikisht nuk mund ta shohin numrin.
      </p>

      <h2>3. Të dhënat, qëllimet dhe baza e propozuar</h2>
      <ul>
        <li>
          <strong>Përmbajtja publike:</strong> propozime, versione, argumente, prova, emër publik i
          zgjedhur, histori moderimi dhe rezultate, për të operuar dhe dokumentuar procesin qytetar.
        </li>
        <li>
          <strong>Votimi anonim:</strong> kredenciale, prova, nullifikues të kufizuar sipas
          propozimit, angazhime të fletëve dhe mandate përfshirjeje, për të pranuar vetëm një votë
          të vlefshme pa krijuar profil qytetar.
        </li>
        <li>
          <strong>Verifikimi:</strong> numri vetëm në memorien e kërkesës; përmbledhje të çelësuara
          të numrit dhe OTP-së për vlefshmëri, parandalim përsëritjeje dhe abuzimi.
        </li>
        <li>
          <strong>Njoftimet:</strong> abonimi push i enkriptuar dhe temat e zgjedhura, vetëm pasi
          përdoruesi jep leje në shfletues.
        </li>
        <li>
          <strong>Siguria dhe administrimi:</strong> veprime të emërtuara të moderatorëve, kontrolle
          aksesi dhe regjistra auditimi në një zonë të ndarë.
        </li>
      </ul>
      <p>
        Bazat ligjore të propozuara janë kryerja e shërbimit të kërkuar nga përdoruesi, interesat
        legjitime për siguri dhe integritet, pëlqimi për njoftimet dhe emrin vullnetar, dhe
        detyrimet ligjore kur zbatohen. Vlerësimi përfundimtar i bazës ligjore është pjesë e
        shqyrtimit ligjor dhe DPIA-së para përpunimit real.
      </p>

      <h2>4. Çfarë nuk provon OTP-ja</h2>
      <p>
        Kodi provon kontrollin e një numri në atë moment. Ai nuk provon identitetin, shtetësinë,
        vendbanimin, veçantinë si person ose të drejtën zgjedhore. Rezultatet quhen “pjesëmarrje e
        verifikuar me telefon”, janë këshilluese dhe nuk pretendojnë të përfaqësojnë qytetarët ose
        banorët e Shqipërisë.
      </p>

      <h2>5. IP-ja dhe shteti i sugjeruar</h2>
      <p>
        Cloudflare sheh adresën IP si ofrues i rrjetit. Aplikacioni Kuvend nuk e lexon ose ruan
        IP-në për sugjerimin e shtetit. Ai lexon vetëm kodin dyshkronjësh që Cloudflare vendos në
        kërkesë, ia kthen përkohësisht shfletuesit me udhëzimin <code>no-store</code> dhe nuk e
        shkruan në databazë, analytics ose regjistrat e aplikacionit.
      </p>

      <h2>6. Marrësit dhe transferimet</h2>
      <p>
        Railway ofron infrastrukturën e aplikacionit dhe bazat e ndara; Cloudflare ofron DNS,
        mbrojtje dhe shpërndarje; Sent dhe Meta/WhatsApp do të përdoren vetëm për dërgimin e kodit;
        një ofrues AI përdoret vetëm kur përdoruesi kërkon ndihmë opsionale. Kuvend nuk shet të
        dhëna, nuk shfaq reklama dhe nuk ngarkon SDK analitike ose gjurmimi në shfletues.
      </p>
      <p>
        Disa përpunues janë jashtë Shqipërisë. Para verifikimit real, Revido LLC duhet të përfundojë
        marrëveshjet e përpunimit, listën e nën-përpunuesve dhe mekanizmin e ligjshëm të
        transferimit, përfshirë klauzolat standarde kur kërkohen. Shih{" "}
        <a href="https://www.sent.dm/legal/data-processing-addendum" rel="external noreferrer">
          marrëveshjen e përpunimit të Sent
        </a>{" "}
        dhe{" "}
        <a href="https://www.sent.dm/legal/privacy-policy" rel="external noreferrer">
          politikën e Sent
        </a>
        .
      </p>

      <h2>7. Ruajtja</h2>
      <ul>
        <li>Numri i pastër ekziston vetëm në memorien e kërkesës dhe nuk hyn në backup.</li>
        <li>Sfida dhe përmbledhja e OTP-së skadojnë pas pesë minutash.</li>
        <li>Përmbledhja e kufizimit të ridërgimit skadon pas dhjetë minutash.</li>
        <li>Kredenciali anonim në pajisje zgjat deri në 30 ditë.</li>
        <li>Draftet AI dhe audioja hidhen pasi përdoruesi i pranon ose i anulon.</li>
        <li>
          Abonimi push mbahet deri në çregjistrim, skadim ose refuzim nga ofruesi i shfletuesit.
        </li>
        <li>
          Përmbajtja e pranuar, vendimet, rezultatet dhe auditimet publike mbahen për llogaridhënie;
          afati përfundimtar arkivor miratohet para pilotit real.
        </li>
      </ul>
      <p>
        Sent dhe Meta kanë rregullat e tyre të ruajtjes. Kufijtë kontraktualë dhe fshirja e tyre
        janë kusht nisjeje. Backup-et nuk duhet të zgjasin në heshtje një afat të premtuar.
      </p>

      <h2>8. Të drejtat e tua</h2>
      <p>
        Sipas Ligjit shqiptar nr. 124/2024 mund të kërkosh informacion, akses, korrigjim, fshirje,
        kufizim, kundërshtim dhe, kur zbatohet, transferueshmëri; mund të tërheqësh pëlqimin pa
        cenuar përpunimin e mëparshëm. Kuvend nuk përdor vendimmarrje automatike për moderim ose
        pranimin e votës.
      </p>
      <p>
        Dizajni anonim do të thotë se Revido LLC mund të mos jetë në gjendje ta lidhë një kërkesë me
        votën ose pseudonimin tënd. Ruaj mandatin e përfshirjes ose sekretin e aftësisë kur shërbimi
        ta jep; pa të, nuk do të krijojmë një lidhje identiteti vetëm për të përmbushur kërkesën.
      </p>
      <p>
        Mund të ankohesh te Komisioneri për të Drejtën e Informimit dhe Mbrojtjen e të Dhënave
        Personale, Rr. “Abdi Toptani”, Nd. 5, Tiranë 1001, +355 42 23 7200,{" "}
        <a href="mailto:info@idp.al">info@idp.al</a>, ose përmes{" "}
        <a href="https://idp.al/en/complain/" rel="external noreferrer">
          faqes së ankesave
        </a>
        .
      </p>

      <h2>9. Siguria, fëmijët dhe ndryshimet</h2>
      <p>
        Shërbimet, çelësat, databazat dhe auditimet ndahen sipas rolit. Megjithatë, asnjë sistem nuk
        është pa rrezik dhe kriptografia nuk provon se një server i komprometuar nuk ka regjistruar
        fshehurazi të dhëna. Mos publiko të dhëna personale të fëmijëve ose të personave të tjerë.
        Përdoruesit që nuk mund t’i pranojnë ligjërisht këto kushte nuk duhet të dorëzojnë ose
        votojnë.
      </p>
      <p>
        Ndryshimet materiale publikohen me datë të re dhe, kur ndikojnë në përpunim, me njoftim të
        dukshëm para se të hyjnë në fuqi.
      </p>
    </LegalPage>
  );
}
