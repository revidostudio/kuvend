# Legal and processor readiness

This is an engineering and legal-review record, not legal advice. It must be signed off by qualified
counsel before Kuvend accepts real participant data.

## Controller and public contacts

- Controller and operator: **Revido LLC**
- Published address: **2106 House, Ave Suite 383, Cheyenne, Wyoming 82001, USA**
- Company site: [revido.co](https://revido.co)
- Privacy requests: privacy@kuvend.org
- Security reports: security@kuvend.org
- Moderation and appeals: moderation@kuvend.org
- Legal questions: legal@kuvend.org

The controller name and public address are now identified. Counsel must still confirm Revido LLC’s
registration details, Albanian establishment/representative obligations, governing law, competent
forum, child-participation rules, lawful bases, breach workflow, and whether a DPO or local
representative is required.

## Governing sources

- Albania Law no. 124/2024 “On Personal Data Protection”:
  [official English text](https://idp.al/wp-content/uploads/2025/08/Eng-_Law-124_2024-_On-Personal-Data-Protection.pdf)
- Albanian Commissioner:
  [official legislation](https://idp.al/en/data-protection-legislation/) and
  [complaint channel](https://idp.al/en/complain/)
- Sent:
  [DPA](https://www.sent.dm/legal/data-processing-addendum),
  [privacy policy](https://www.sent.dm/legal/privacy-policy), and
  [terms](https://www.sent.dm/en/legal/terms-of-service)

## Processing map

| Domain              | Permitted data                                                                          | Forbidden data                                        | Purpose                                                         |
| ------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| browser             | user-entered phone, device-held credential, content draft, receipts and recovery secret | issuer keys, admin identity                           | user-controlled entry and local state                           |
| web edge            | Cloudflare two-letter country header                                                    | application access to raw IP for country selection    | ephemeral country-code suggestion with no-store                 |
| isolated issuer     | plaintext phone in request memory, keyed phone/OTP digests, issuance epoch              | proposal, argument, ballot, receipt, civic pseudonym  | rate-limited phone-control verification and anonymous issuance  |
| Sent managed sender | phone, OTP template/text variables, delivery metadata                                   | civic content, ballot, receipt, recovery secret       | WhatsApp-first code delivery and user-selected SMS backup       |
| Meta/WhatsApp       | phone, message and delivery metadata                                                    | civic content, ballot, receipt, recovery secret       | WhatsApp transport                                              |
| Mobile carrier      | phone, SMS content and delivery metadata                                                | civic content, ballot, receipt, recovery secret       | SMS transport only after explicit participant selection         |
| civic service       | public content, proof, scoped nullifier, ballot commitment                              | phone, OTP, identity session, stable participant ID   | proposals, arguments, advisory voting, receipts                 |
| assistant           | explicitly supplied draft during the request                                            | phone, credential, ballot, receipt, capability secret | optional correction, simplification, transcription, translation |
| notifications       | encrypted push subscription and chosen topics                                           | phone, vote, credential                               | opt-in notifications                                            |
| administration      | named maintainer identity, role, action and access audit                                | issuer phone records and anonymous ballot linkage     | accountable moderation and operations                           |

## Processor register

| Processor                   | Data                                                                       | Role and gate                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Railway                     | service records, separated encrypted databases and infrastructure metadata | processor; region, DPA, access, backup and deletion review                                                     |
| Cloudflare                  | IP and network metadata; two-letter country header                         | processor/network provider; DPA, logging and transfer review                                                   |
| Sent                        | phone, OTP variables and delivery metadata                                 | verification processor; execute DPA, approve subprocessors, retention, dashboard access, transfer and deletion |
| Meta/WhatsApp               | phone and message/delivery metadata                                        | communications provider; approve legal basis, transfer and retention                                           |
| OpenRouter + model provider | user-selected draft only                                                   | processors; request-level ZDR routing, subprocessor and transfer review required                               |
| independent relay           | source IP and encrypted padded request                                     | future independent operator; no content access                                                                 |

Sent is not an identity provider for the civic service. Only the isolated issuer may call Sent.
There is no browser SDK, webhook, device signal, silent SMS fallback, civic metadata, or retained Sent
message ID in the reference integration. Adding channels, tracking, or provider features requires a
new data-flow decision, updated DPIA, and updated public notice.

## Legal and launch decisions still required

1. Counsel approves the Albanian and English privacy notice and terms.
2. Revido LLC documents lawful bases for each processing purpose.
3. Revido LLC completes and signs the DPIA.
4. Processor agreements, subprocessors, transfer mechanisms, retention, deletion, and audit rights
   are approved for Railway, Cloudflare, Sent, Meta/WhatsApp, and any AI provider.
5. A breach process, data-subject workflow, and regulator-contact procedure are rehearsed.
6. The issuer and privacy relay move to independent operators/accounts before the strong claim
   “Kuvend cannot see your number” is used.
7. An independent cryptographer approves the credential construction and publishes test vectors.
8. Role mailboxes are live and monitored before publication of real participation.

Until these gates pass, Railway production is labelled an **experimental beta** and stronger anonymity claims remain prohibited.
