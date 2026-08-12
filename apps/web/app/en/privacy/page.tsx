import type { Metadata } from "next";
import { LegalPage } from "../../legal-page";

export const metadata: Metadata = {
  title: "Privacy policy — Kuvend",
  description: "How Revido LLC and Kuvend process, separate, and protect data.",
  alternates: {
    canonical: "/en/privacy",
    languages: { sq: "/privatesia", en: "/en/privacy" },
  },
};

export default function EnglishPrivacyPage() {
  return (
    <LegalPage
      locale="en"
      updated="9 August 2026"
      title="Privacy policy"
      lead="Kuvend minimizes personal data and separates phone verification from proposals, arguments, and ballots."
      alternate={{ href: "/privatesia", label: "Lexoje këtë politikë në shqip" }}
    >
      <aside className="trust-status" aria-label="Policy status">
        <strong>Experimental beta.</strong> This policy describes the live WhatsApp verification,
        Semaphore membership system, and current limits. Assessments, processor agreements, and
        independent reviews are published as they are completed.
      </aside>

      <h2>1. Who is responsible</h2>
      <p>
        Revido LLC, 2106 House, Ave Suite 383, Cheyenne, Wyoming 82001, USA, is the operator and
        controller of Kuvend. Kuvend is independent and non-governmental. It is not affiliated with
        the Parliament of Albania or any public authority.
      </p>
      <p>
        Contact <a href="mailto:privacy@kuvend.org">privacy@kuvend.org</a> about privacy or your
        rights and <a href="mailto:security@kuvend.org">security@kuvend.org</a> about security.
      </p>

      <h2 id="anonymous-voting">2. How verification is separated from participation</h2>
      <p>
        The isolated issuer temporarily receives the number, requests a one-time code, and records
        only the public commitment of an identity created on the device. The civic service receives
        only a cryptographic proof and a proposal-scoped marker. Its schemas reject phone numbers,
        OTPs, identity sessions, and stable participant identifiers.
      </p>
      <p>
        Sent uses its managed sender and, together with WhatsApp/Meta, processes the number and
        delivery data. Sent and Meta do not receive proposal text, votes, arguments, inclusion
        receipts, or recovery secrets. During beta the issuer does not yet have an independent
        operator, so Kuvend does not claim that maintainers technically cannot see the number.
      </p>

      <h2>3. Data, purposes, and proposed legal basis</h2>
      <ul>
        <li>
          <strong>Public content:</strong> proposals, revisions, arguments, evidence, chosen public
          name, moderation history, and results, to operate and document the civic process.
        </li>
        <li>
          <strong>Anonymous voting:</strong> credentials, proofs, proposal-scoped nullifiers, ballot
          commitments, and inclusion receipts, to accept one valid vote without a citizen profile.
        </li>
        <li>
          <strong>Verification:</strong> the number in request memory only, plus keyed phone and OTP
          digests for validity, replay prevention, and abuse controls.
        </li>
        <li>
          <strong>Notifications:</strong> an encrypted push subscription and selected topics, only
          after browser permission.
        </li>
        <li>
          <strong>Security and administration:</strong> named moderator actions, access controls,
          and audit records in a separate trust domain.
        </li>
      </ul>
      <p>
        Proposed legal bases are providing the service requested by the user, legitimate interests
        in security and integrity, consent for notifications and a voluntary public name, and legal
        obligations where applicable. The legal basis and DPIA remain under review during the beta;
        material changes are published here.
      </p>

      <h2>4. What OTP does not prove</h2>
      <p>
        The code proves control of a number at that moment. It does not prove identity, age,
        citizenship, residence, one-person uniqueness, or electoral eligibility. Results are
        labelled verified-phone participation, are advisory, and do not claim to represent Albanian
        citizens or residents.
      </p>

      <h2>5. IP address and country suggestion</h2>
      <p>
        Cloudflare sees the IP address as a network provider. The Kuvend application does not read
        or retain the IP to suggest a country. It reads only Cloudflare’s two-letter request header,
        returns that hint to the browser with <code>no-store</code>, and does not write it to a
        database, analytics system, or application log.
      </p>

      <h2>6. Recipients and transfers</h2>
      <p>
        Railway supplies application infrastructure and separated databases; Cloudflare supplies
        DNS, protection, and delivery; Sent and Meta/WhatsApp are intended only for code delivery;
        an AI provider is used only when a user requests optional assistance. Kuvend does not sell
        data, show advertising, or load behavioral analytics or tracking SDKs in the browser.
      </p>
      <p>
        Some processors are outside Albania. Before real verification, Revido LLC must complete
        processing agreements, subprocessor review, and lawful transfer mechanisms, including
        standard contractual clauses where required. See Sent’s{" "}
        <a href="https://www.sent.dm/legal/data-processing-addendum" rel="external noreferrer">
          data processing addendum
        </a>{" "}
        and{" "}
        <a href="https://www.sent.dm/legal/privacy-policy" rel="external noreferrer">
          privacy policy
        </a>
        .
      </p>

      <h2>7. Retention</h2>
      <ul>
        <li>The plaintext number exists only in request memory and is excluded from backups.</li>
        <li>The challenge and OTP digest expire after five minutes.</li>
        <li>The resend rate-limit digest expires after ten minutes.</li>
        <li>The anonymous device credential lasts up to 30 days.</li>
        <li>AI drafts and audio are discarded after acceptance or cancellation.</li>
        <li>A push subscription remains until unsubscribe, expiry, or provider rejection.</li>
        <li>
          Accepted content, decisions, results, and public audits are retained for accountability;
          the final archive period must be approved before a real pilot.
        </li>
      </ul>
      <p>
        Sent and Meta apply their own retention rules. Contractual limits and deletion behavior are
        launch conditions. Backups must not silently extend a promised deletion period.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Under Albanian Law no. 124/2024, you may request information, access, correction, deletion,
        restriction, objection, and portability where applicable, and withdraw consent without
        affecting prior processing. Kuvend does not use automated decision-making for moderation or
        ballot acceptance.
      </p>
      <p>
        Anonymous design means Revido LLC may be unable to connect a request to your ballot or
        pseudonym. Keep any inclusion receipt or capability secret the service gives you. We will
        not create an identity link merely to answer a request.
      </p>
      <p>
        You may complain to Albania’s Commissioner for the Right to Information and Personal Data
        Protection, Rr. “Abdi Toptani”, Nd. 5, Tirana 1001, +355 42 23 7200,{" "}
        <a href="mailto:info@idp.al">info@idp.al</a>, or through its{" "}
        <a href="https://idp.al/en/complain/" rel="external noreferrer">
          complaint page
        </a>
        .
      </p>

      <h2>9. Security, children, and changes</h2>
      <p>
        Services, keys, databases, and audits are separated by role. No system is risk-free, and
        cryptography cannot prove that a compromised server did not secretly log data. Do not
        publish a child’s or another person’s private information. Anyone unable to accept these
        terms legally should not submit or vote.
      </p>
      <p>
        Material changes receive a new date and, when they affect processing, a prominent notice
        before they take effect.
      </p>
    </LegalPage>
  );
}
