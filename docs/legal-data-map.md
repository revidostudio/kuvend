# Legal and processor readiness

This document is an implementation checklist, not legal advice.

Before real phone verification, Kuvend must identify its controller, lawful bases, processor roles, international transfers, participant rights, complaint path, breach process, and retention periods under Albania Law 124/2024.

## Processors

| Processor class                    | Data                                    | Required gate                               |
| ---------------------------------- | --------------------------------------- | ------------------------------------------- |
| WhatsApp verification through Sent | phone, delivery metadata, OTP state     | DPA, retention and transfer review          |
| AI provider                        | proposal draft only                     | zero-retention or approved low-risk use     |
| hosting                            | service records and encrypted databases | region, access, backup and deletion review  |
| relay operator                     | source IP and encrypted padded message  | independent operation and no content access |

Required public role addresses are `privacy@kuvend.org`, `security@kuvend.org`, and `moderation@kuvend.org`. DNS and mail records are intentionally not created by the reference implementation.

### Sent WhatsApp trial constraints

Sent is a candidate WhatsApp verification processor and supplies the managed sender; it is not an identity provider for the civic service. The isolated issuer is the only Kuvend service permitted to call Sent. Sent and Meta/WhatsApp necessarily receive the phone number, OTP content and verification/delivery metadata; their dashboard access, retention, subprocessors, international transfers and deletion behavior require written approval before real testing.

The integration deliberately excludes browser/mobile provider SDKs, webhooks, device signals, SMS fallback and civic metadata. The web edge uses Cloudflare's request-country header only to return an ephemeral two-letter country hint with `no-store`; it does not persist or log the IP or hint. The issuer does not retain Sent message IDs. Any later addition of channels, tracking or provider features is a new data-flow decision requiring an updated impact assessment and privacy notice.
