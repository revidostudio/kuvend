import type { Metadata } from "next";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Privatësia — Kuvend",
  description: "Si ndahen dhe mbrohen të dhënat në Kuvend.",
  alternates: { canonical: "/privatesia" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privatësia"
      lead="Kuvend është projektuar që shërbimi qytetar të mos marrë numrin tënd të telefonit ose një identifikues të qëndrueshëm qytetar."
    >
      <h2 id="si-mbrohet-vota">Si mbrohet vota pa emër</h2>
      <p>
        Procesi ndahet në shërbime që nuk marrin të njëjtin informacion. Shërbimi i verifikimit
        kontrollon përkohësisht numrin dhe lëshon një dëshmi anonime. Shërbimi qytetar merr vetëm
        dëshminë dhe një shenjë unike për propozimin; ai nuk merr numrin e telefonit. Fleta e votës
        ruhet me një mandat përfshirjeje që mbahet nga pjesëmarrësi.
      </p>
      <h2>Çfarë përpunohet</h2>
      <p>
        Propozimet, argumentet dhe votat përpunohen nga shërbimi qytetar. Numri përpunohet
        përkohësisht vetëm nga shërbimi i izoluar i verifikimit dhe ofruesi SMS. Në beta, ky shërbim
        operohet ende nga Kuvend; prandaj nuk pretendojmë se mirëmbajtësit nuk mund ta shohin
        numrin.
      </p>
      <h2>Çfarë nuk provon OTP-ja</h2>
      <p>
        OTP provon kontrollin e një numri, jo shtetësinë, vendbanimin, veçantinë si person ose të
        drejtën zgjedhore. Rezultatet janë pjesëmarrje e verifikuar me telefon dhe vetëm
        këshilluese.
      </p>
      <h2>Ruajtja dhe ndarja</h2>
      <p>
        Teksti i asistencës përpunohet pa ruajtje. Sfida OTP zgjat pesë minuta; një përmbledhje e
        çelësuar mbahet për dritaren dhjetëminutëshe të kufizimit të kërkesave. Abonimet push ruhen
        të enkriptuara në një bazë të ndarë. Nuk përdorim reklama, gjurmim sjelljeje ose SDK
        analitike në shfletues.
      </p>
      <h2>Kufijtë</h2>
      <p>
        Skemat dhe kriptografia mund të provojnë ndarjen dhe përfshirjen e votës, por jo që një
        server i komprometuar nuk ka mbajtur fshehurazi të dhëna. Nisja sensitive kërkon operatorë
        të pavarur dhe auditim të publikuar.
      </p>
      <p>
        Pyetje ose kërkesa: <a href="mailto:privacy@kuvend.org">privacy@kuvend.org</a>.
      </p>
      <hr />
      <h2>English summary</h2>
      <p>
        Kuvend’s civic service does not receive phone numbers. During beta, Kuvend’s isolated
        verification service and its SMS provider temporarily process the number. OTP proves phone
        control only. Results are advisory and non-representative. Sensitive launch remains blocked
        pending independent operation, legal review, and security/privacy audits.
      </p>
    </LegalPage>
  );
}
