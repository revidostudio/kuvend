# Kuvend product specification

## Positioning

Kuvend is an independent, non-governmental platform at `kuvend.org` where people propose changes concerning Albania, add structured arguments, and cast anonymous advisory votes. It is not affiliated with the Assembly of Albania, a political party, or a government institution.

Participation is described as **verified phone participation**, never as citizenship, residency, a representative sample, or a legally binding election.

## Core flow

1. Anyone may browse without registration.
2. A participant drafts a proposal in Albanian by typing or, after the privacy gate is met, dictation.
3. Optional assistance may correct grammar, simplify language, translate, and show likely duplicates.
4. The participant explicitly accepts or rejects every suggested change.
5. A synthetic credential is used in development. An approved low-stakes trial may use Prelude through the isolated issuer to verify phone control once per 30-day credential period, while keeping the credential protocol explicitly synthetic.
6. The proposal is submitted under a random per-proposal pseudonym or a self-provided, explicitly unverified public name.
7. Moderators check scope, safety, personal information, impersonation, spam, and duplication within 72 hours.
8. Every eligible, nonduplicate proposal enters a 14-day advisory vote covering two weekends.
9. Before voting, visitors see turnout only. A participant confirms one final `support` or `oppose` vote, then may see the live split.
10. At closing, results become public and the proposal is routed to a relevant institution. The public record shows whether a response arrived.

## Proposal content

Required fields are title, problem, proposed change, geographic scope, and category. Proposals and arguments may add structured evidence items with a type, title, HTTPS URL, and optional publisher and date. Types include sources, documents, images, and videos. The beta links to media instead of uploading or embedding it, avoiding retained file metadata and passive third-party tracking.

Discussion uses independent `for` and `against` arguments. There are no nested comment threads, followers, profiles, reputation scores, leaderboards, advertising, or algorithmic engagement ranking.

Every public proposal has a durable, indexable URL and share preview. People may subscribe to new public voting rounds using browser push or RSS. Notification subscriptions are not accounts and are isolated from participation data.

## Author capability

Submission returns a random recovery secret. Only its hash is stored. Possession permits revision, withdrawal, and appeal; losing it cannot be repaired by looking up a phone identity.

## Results and institutional response

Kuvend reports turnout, support, opposition, dates, method, and limitations. It does not label results binding or representative. After closing, statuses are `awaiting_response`, `responded`, or `no_response`.

## Release boundaries

The synthetic reference system may use fake credentials and harmless topics. Real sensitive participation is blocked until the credential construction, OHTTP deployment, operators, legal basis, retention, and incident procedures receive independent review.
