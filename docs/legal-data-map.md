# Legal and processor readiness

This document is an implementation checklist, not legal advice.

Before real phone verification, Kuvend must identify its controller, lawful bases, processor roles, international transfers, participant rights, complaint path, breach process, and retention periods under Albania Law 124/2024.

## Processors

| Processor class  | Data                                    | Required gate                               |
| ---------------- | --------------------------------------- | ------------------------------------------- |
| SMS verification | phone, delivery metadata, OTP state     | DPA, retention and transfer review          |
| AI provider      | proposal draft only                     | zero-retention or approved low-risk use     |
| hosting          | service records and encrypted databases | region, access, backup and deletion review  |
| relay operator   | source IP and encrypted padded message  | independent operation and no content access |

Required public role addresses are `privacy@kuvend.org`, `security@kuvend.org`, and `moderation@kuvend.org`. DNS and mail records are intentionally not created by the reference implementation.

### Prelude trial constraints

Prelude is a candidate SMS verification processor, not an identity provider for the civic service. The isolated issuer is the only Kuvend service permitted to call Prelude. Prelude necessarily receives the phone number and verification/delivery metadata; its dashboard access, retention, subprocessors, international transfers and deletion behavior require written approval before real testing.

The integration deliberately excludes Prelude Watch, Auth, browser/mobile SDKs, webhooks, device signals, IP signals and civic metadata. Any later enablement is a new data-flow decision requiring an updated impact assessment and privacy notice.
