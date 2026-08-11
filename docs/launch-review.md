# Kuvend launch review packet

This document is the handoff package for independent privacy, cryptography,
security and data-protection reviewers. It describes what can be reviewed now
and what is deliberately disabled in production.

## Current production posture

Production is fail-closed:

- `OTP_PROVIDER=development` is not a production participation mechanism.
- The issuer reports `participationOpen=false` and returns `503 verification_not_available`.
- The civic API reports `participationOpen=false` and returns `503 participation_not_available` for ballots.
- The web application removes stale credentials and disables voting when issuer verification is unavailable.

This is intentional. A WhatsApp OTP proves control of a phone number; it does
not prove citizenship, uniqueness, or provide an unlinkable voting credential.
Sent/WhatsApp delivery must therefore not be confused with completion of the
anonymous voting protocol.

## Reviewable implementation

The repository contains the complete adapter boundary for the isolated issuer:

- `apps/issuer/src/sentdm-provider.ts` sends only the E.164 number, approved
  template, one-time code and `whatsapp` channel to Sent.
- The issuer stores keyed phone digests and short-lived challenge state; civic
  payloads do not accept phone numbers, OTPs or stable participant IDs.
- `apps/civic-api/src/app.ts` accepts only credential proofs and scoped
  nullifiers at its schema boundary.
- Production deployment and health checks are documented in
  `docs/deployment.md` and `docs/railway-operations.md`.

Reviewers should verify these claims from source, database snapshots, logs,
backups, provider dashboards and deployment configuration rather than relying
on the documentation alone.

## Required launch decisions

Before opening real participation, reviewers must publish a written decision
on each item:

1. Credential construction, issuance, redemption, renewal and key rotation.
2. Protection against repeat voting across credential renewals.
3. OHTTP relay and gateway separation, including metadata and failure modes.
4. Issuer independence, operator access, logging, backups and incident response.
5. Sent data-processing agreement, retention, deletion, EEA transfer and access controls.
6. Albanian carrier delivery and fraud controls for the approved WhatsApp template.
7. Legal basis, DPIA and public wording under Albania's data-protection law.
8. Reproducible builds, signed releases, key custody and two-person production approval.

No single maintainer may mark these items complete. The decision record and
test vectors must be committed before the participation gate is changed.

## Evidence to attach

- Credential protocol specification and independent cryptographer sign-off.
- Public test vectors for valid, invalid, replayed, renewed and rotated proofs.
- OHTTP conformance results and a diagram of the independent operators.
- Database, log, trace and backup scans showing forbidden-field absence.
- Sent delivery results for consenting ONE Albania and Vodafone Albania testers.
- Published DPIA, processor agreements, retention schedule and incident exercise.
- External application, infrastructure and privacy audit reports.

## Verification commands

```sh
pnpm infra:check
pnpm validate
pnpm exec playwright test tests/e2e/mobile-flows.spec.ts
curl -fsS https://issuer.kuvend.org/health
curl -fsS https://api.kuvend.org/health
```

The final two responses must show `participationOpen=false` until every launch
gate above is approved. Enabling participation is a separate, reviewed change;
it must never be achieved by deleting fail-closed participation checks.
