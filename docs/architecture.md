# Architecture

## Design objective

No project-controlled component should learn both a participant's verified phone identity and their civic action. The stronger operational goal is that no founder or single maintainer controls enough services, logs, keys, or deployments to reconstruct that link.

## Trust boundaries

| Component | May learn | Must not learn | Operated by |
| --- | --- | --- | --- |
| Credential issuer | phone, eligibility, coarse issuance epoch | topic, proposal, vote, civic cookie | independent issuer operator |
| User client | phone entered by user, credential, content | operator secrets | participant; reproducibly built where possible |
| Privacy relay | source IP, encrypted padded request | phone, credential, content, destination path details beyond routing need | independent relay operator |
| Gateway/mixer | decrypted redemption request, coarse arrival epoch | source IP, phone, OTP session | operator independent of relay and issuer |
| Civic service | topic, proposal or vote, one-time nullifier | phone, auth user ID, source IP, issuer session | country-instance operator |

## Participation flow

1. The client creates a blinded credential request without a topic identifier.
2. The issuer verifies eligibility, rate-limits issuance, and signs the blinded request.
3. The client unblinds the credential and clears issuer state.
4. After a delay chosen from a sufficiently broad issuance epoch, the client sends a padded request through an independently operated privacy relay.
5. The gateway validates and mixes requests before passing them to the civic service.
6. For a proposal, the credential is one-time. For voting, the client derives a topic-scoped nullifier so duplicate voting is rejected without a stable cross-topic identity.
7. The civic service stores content, proof/nullifier, moderation state, and coarse publication time only.

The exact credential and relay protocols are not selected yet. Candidates must be standards-based, support the required unlinkability and abuse constraints, and receive independent review.

## Deployment rules

- Identity and civic services use different domains, cloud accounts, databases, keys, operators, and monitoring.
- Neither service sends logs to a shared platform.
- Request bodies, phone values, exact redemption timestamps, and raw IP addresses are excluded from application logs.
- The civic origin is not directly reachable around the relay path.
- Backups cannot silently preserve data promised to be deleted.
- Privileged access and releases require multiple maintainers and generate a public audit record where safe.
- Country instances have independent databases and explicit instance manifests.

## Nonanonymous administration

Maintainer accounts and sponsor administration are a different security domain. A conventional account framework such as Better Auth may be used there, but its cookies, identifiers, database, telemetry, and origin must never enter the anonymous participation path.
