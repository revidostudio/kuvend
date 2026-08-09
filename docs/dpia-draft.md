# Draft data protection impact assessment

**Status:** engineering draft for Revido LLC and independent legal/privacy review.  
**Controller:** Revido LLC, 2106 House, Ave Suite 383, Cheyenne, Wyoming 82001, USA.  
**Service:** Kuvend, an independent Albanian advisory participation platform.  
**Decision:** real phone verification and sensitive participation remain blocked.

## 1. Processing and purpose

Kuvend lets people publish public-policy proposals and arguments and cast advisory votes. Phone
control is used only to rate-limit participation and issue an anonymous 30-day credential. It is
not used to establish identity, citizenship, residence, one-person uniqueness, or electoral
eligibility.

The issuer, civic service, assistant, notifications service, and administration domain use separate
schemas, databases, credentials, logs, and keys. The civic service rejects phone numbers, OTPs,
identity sessions, and stable participant identifiers. The issuer is forbidden from receiving civic
content. The full field map is in docs/legal-data-map.md.

## 2. Necessity and proportionality

- Browsing requires no registration.
- Verification is no more frequent than once per 30-day credential period.
- International numbers are allowed, and public claims are limited to verified-phone participation.
- Plaintext phone data is held only in request memory by the issuer and the delivery chain.
- Duplicate-vote prevention uses proposal-scoped nullifiers, not an account or global civic ID.
- Country prefill uses only Cloudflare’s ephemeral two-letter header; the application does not read
  or retain the IP for that purpose.
- AI assistance, public names, notifications, and evidence are optional.
- Vote choice is not shown in live totals until the participant’s final vote is accepted.

Less intrusive alternatives were considered. No verification would materially weaken abuse
resistance; identity accounts would create a much greater linkage risk; per-vote OTP would increase
cost and issuance-to-vote timing correlation. The selected approach remains conditional on
independent cryptographic and legal review.

## 3. People and data affected

Participants may include people in Albania and abroad who browse, propose, argue, subscribe, or
vote. Public political opinions and content may reveal sensitive beliefs by context. Phone and
delivery metadata are processed only in the issuer/provider domain. Administrators’ identities and
actions are retained separately for accountability.

Children’s personal data must not be posted. Counsel must determine the age/authorization rule for
active participation and whether additional controls are required.

## 4. Risk assessment

| Risk                                                             | Likelihood/impact before controls | Controls                                                                                | Residual decision                                     |
| ---------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| issuer and civic data are joined                                 | medium / severe                   | no shared IDs, schema rejection, separate databases/keys/logs, blind credential adapter | high until independent operator and reviewed protocol |
| Sent or Meta retains/transfers phone metadata beyond expectation | medium / high                     | minimum template data, no civic metadata, DPA/subprocessor review                       | high until written limits and transfer review         |
| provider or issuer account compromise                            | medium / severe                   | scoped keys, MFA, least privilege, isolated service, audit records                      | independent security review required                  |
| OTP pumping or automated issuance                                | high / medium                     | five-minute challenge, ten-minute resend digest, provider budgets and throttles         | load/abuse exercise required                          |
| phone or device loss                                             | medium / medium                   | short credential life, explicit receipt/recovery warnings, no identity recovery         | accepted only with tested recovery UX                 |
| public political content exposes a person                        | medium / high                     | random per-proposal pseudonym by default, optional unverified name, PII moderation      | moderator training and appeal audit required          |
| IP timing links issuance to civic activity                       | medium / severe                   | 30-day credential, no cross-service trace IDs, planned OHTTP relay                      | high until relay and independent operators exist      |
| AI changes meaning or leaks a sensitive draft                    | medium / high                     | opt-in, side-by-side approval, no fact invention, ephemeral handling                    | provider zero-retention or self-hosting required      |
| child or third-party data is published                           | medium / high                     | prohibition, moderation, reporting and removal path                                     | legal age rule and response procedure required        |
| compromised server secretly logs forbidden data                  | low / severe                      | typed schema rejection, log scans, provenance, audits, separate operators               | cannot be eliminated; disclose and audit              |
| anonymous design prevents rights-request matching                | high / medium                     | participant-held receipt/capability, explain limitation, no identity backdoor           | disclose and test request workflow                    |

## 5. Safeguards and verification

- Contract, unit, database-snapshot, log, trace, backup, credential, OHTTP, accessibility, and abuse
  tests are required by the product plan.
- Production releases require protected branches, signed build provenance, dependency inventory,
  two-person approval, and immutable administrator audit events.
- The public notice explains the phone-provider boundary, OTP limitations, advisory status,
  anonymity limits, retention, recipients, transfers, and rights.
- A participant receives an inclusion receipt; signed closed-round metadata and commitments support
  verification without publishing a phone or vote.

## 6. Consultation and approvals

Before real processing, Revido LLC must obtain:

1. Albanian counsel approval under Law no. 124/2024, including controller presence/representative,
   lawful basis, children, transfers, terms, and regulator consultation if required.
2. Data-protection review of Railway, Cloudflare, Sent, Meta/WhatsApp, and any AI provider.
3. Independent cryptographic selection and implementation review with published test vectors.
4. Independent application/infrastructure security assessment with no unresolved critical/high
   findings.
5. Native Albanian usability and meaning-preservation review across ages, regions, education levels,
   and dialect backgrounds.

## 7. Launch blockers and sign-off

The following prevent activation of OTP_PROVIDER=sentdm and real participation:

- no signed legal opinion or completed DPIA;
- no documented DPA/transfer/retention decision for all processors;
- no independent issuer operator;
- no independently approved credential construction and OHTTP production path;
- no three-maintainer/two-person production process;
- no rehearsed breach, rights-request, restore, and incident response;
- no evidence that the public role mailboxes are operational.

Sign-off fields:

- Revido LLC controller representative: pending
- Albanian legal reviewer: pending
- Data-protection reviewer: pending
- Independent cryptographer: pending
- Security reviewer: pending
- Date and decision: pending
