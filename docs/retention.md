# Data retention schedule

This schedule documents the current reference behavior and the remaining production decisions.
Backups must not silently extend a promised deletion period, and restore exercises must verify
deletion.

| Data                                                    | Current reference behavior                                                          | Real-pilot requirement                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| plaintext phone                                         | request memory only; forbidden from app logs, analytics, databases and backups      | confirm Sent/Meta handling and deletion contractually                |
| keyed OTP challenge digest                              | expires after 5 minutes                                                             | independently review expiry and key destruction                      |
| keyed phone resend digest                               | expires after 10 minutes                                                            | independently review abuse window and key destruction                |
| anonymous device credential                             | expires after 30 days                                                               | reviewed renewal and anti-repeat-voting construction                 |
| country suggestion                                      | returned as a two-letter hint with private, no-store; not persisted                 | verify Cloudflare logs and contract                                  |
| raw IP                                                  | network infrastructure may see it; app does not read/store it for country selection | OHTTP plus operator-specific no-retention controls                   |
| AI draft                                                | process memory only; discarded after accept/cancel                                  | zero-retention agreement or self-hosting                             |
| voice recording                                         | not implemented or retained                                                         | ephemeral self-hosted transcription before sensitive use             |
| rejected unpublished draft                              | civic database only                                                                 | fixed appeal window, then deletion                                   |
| accepted proposal, argument, evidence and public result | retained for public accountability                                                  | counsel-approved archive period and takedown exception               |
| anonymous ballot commitment and scoped nullifier        | retained to prevent duplicate votes and verify inclusion                            | counsel- and cryptographer-approved archive period                   |
| participant-held receipt/capability                     | stored by participant, not identity-recoverable by Kuvend                           | clear loss warning and client deletion controls                      |
| push subscription                                       | encrypted until unsubscribe, expiry, or provider invalidation                       | scheduled pruning and published maximum inactivity period            |
| admin audit event                                       | retained                                                                            | counsel-approved security/legal period and immutable archive control |
| provider delivery metadata                              | controlled by Sent/Meta                                                             | written maximum, deletion path, subprocessors, and transfer approval |

Before real launch, each open-ended row must have an owner, fixed maximum or documented archival
exception, deletion job, backup behavior, and verification test. The processor register in
docs/legal-data-map.md is part of this schedule.
