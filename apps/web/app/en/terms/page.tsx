import type { Metadata } from "next";
import { LegalPage } from "../../legal-page";

export const metadata: Metadata = {
  title: "Terms of use — Kuvend",
  description: "Rules for using the Kuvend civic participation platform.",
  alternates: {
    canonical: "/en/terms",
    languages: { sq: "/kushtet", en: "/en/terms" },
  },
};

export default function EnglishTermsPage() {
  return (
    <LegalPage
      locale="en"
      updated="9 August 2026"
      title="Terms of use"
      lead="Kuvend is an independent space for proposals and advisory participation, not an election, referendum, or government body."
      alternate={{ href: "/kushtet", label: "Lexoji këto kushte në shqip" }}
    >
      <aside className="trust-status" aria-label="Terms status">
        <strong>Draft for legal review.</strong> The public service remains a synthetic beta. These
        terms become final only after legal review and before real participation is accepted.
      </aside>

      <h2>1. Operator and acceptance</h2>
      <p>
        Kuvend is operated by Revido LLC, 2106 House, Ave Suite 383, Cheyenne, Wyoming 82001, USA.
        By submitting a proposal, argument, or vote, you accept these terms and the{" "}
        <a href="/en/privacy">Privacy policy</a>. Public browsing does not require registration.
      </p>
      <p>
        Kuvend is independent and non-governmental. It is not affiliated with the Parliament of
        Albania and does not act for a public authority.
      </p>

      <h2>2. Who may participate</h2>
      <p>
        You may use a supported international number to prove phone control. This does not verify
        your name, age, citizenship, residence, one-person uniqueness, or electoral eligibility. You
        must be legally able to accept these terms. Do not submit a child’s or another person’s
        private information.
      </p>

      <h2>3. Credentials and actions</h2>
      <p>
        Your anonymous credential, inclusion receipt, and recovery secret are for your use. Do not
        sell or automate them or use them to bypass limits. Kuvend cannot recover a lost secret by
        looking up your identity. A ballot has a final confirmation step and cannot be changed
        afterward.
      </p>

      <h2>4. Proposals, arguments, and evidence</h2>
      <p>
        You remain responsible for submitted content and must have the right to publish it. Do not
        post threats, targeted personal data, illegal content, impersonation, spam, or material
        without an actionable public-policy connection. An evidence link does not mean Kuvend
        endorses or has verified it.
      </p>
      <p>
        You grant Revido LLC a non-exclusive, royalty-free, worldwide licence to store, moderate,
        translate, display, distribute, and archive the content only as needed to operate, audit,
        and publicly communicate Kuvend. You retain all other rights.
      </p>

      <h2>5. Moderation and appeals</h2>
      <p>
        Moderators check scope, safety, personal information, and duplication. They may reject,
        hide, or remove content under the <a href="/moderimi">moderation rules</a>. Decisions
        include a reason and, where offered, may be appealed through a private capability link.
        High-risk removals and appeals require two moderators.
      </p>

      <h2>6. AI assistance and external services</h2>
      <p>
        AI help is optional. It may correct, simplify, transcribe, translate, or suggest duplicates,
        but must not change political meaning, invent facts, or make moderation decisions. You
        approve text before publication. “Research” opens ChatGPT, Claude, or Google only after you
        choose it; those services apply their own terms and policies.
      </p>

      <h2>7. Voting and results</h2>
      <p>
        Eligible proposals open for 14 days across two weekends. Total turnout may be shown before
        voting, but the support/oppose split appears only after an accepted vote or the round
        closes. A period is extended only for a documented material outage.
      </p>
      <p>
        Results are advisory, non-representative, and non-binding. They are not an election or
        scientific poll. Revido LLC may forward a result to the relevant institution and publish its
        response or lack of response.
      </p>

      <h2>8. Abuse, suspension, and security</h2>
      <p>
        Interference, unauthorized testing, abusive automation, message pumping, repeat voting,
        limit circumvention, and attempts to link anonymous credentials to people are prohibited.
        Revido LLC may limit an action, credential, or traffic source for security and integrity,
        with an audit trail and appeal where practical.
      </p>

      <h2>9. Availability and liability</h2>
      <p>
        The beta is provided “as is” and may change, pause, or end. We do not guarantee
        uninterrupted availability, delivery of every code, accuracy of user content, or an
        institutional response. Nothing excludes liability or user rights that applicable law does
        not permit us to exclude. To the extent permitted by law, Revido LLC is not liable for
        indirect losses or decisions made solely from Kuvend’s advisory content.
      </p>

      <h2>10. Law, changes, and contact</h2>
      <p>
        The governing law and competent court for the final version will be confirmed by legal
        review, considering the US operator, service in Albania, and users’ mandatory rights. This
        draft does not select a forum that may restrict those rights.
      </p>
      <p>
        Material changes receive a new date and prominent notice. Contact{" "}
        <a href="mailto:legal@kuvend.org">legal@kuvend.org</a> for legal questions,{" "}
        <a href="mailto:privacy@kuvend.org">privacy@kuvend.org</a> for privacy, and{" "}
        <a href="mailto:moderation@kuvend.org">moderation@kuvend.org</a> for moderation.
      </p>
    </LegalPage>
  );
}
