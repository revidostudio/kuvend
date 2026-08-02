# Threat model

## Protected relationship

The primary protected fact is the link between a verified phone number and a proposal or vote. Secondary assets include proposal drafts, eligibility, source network address, moderation evidence, unpublished results, administrator credentials, and the integrity of the served client.

## Adversaries in scope

- a retrospective legal or coercive demand to a project founder;
- a curious, compromised, or coerced maintainer with access to one service;
- compromise of either the issuer, relay, gateway, or civic service in isolation;
- a database or backup leak;
- ordinary network observers without global visibility;
- abuse by participants attempting duplicate submissions or votes;
- a malicious dependency, deployment, or web-client update.

## Adversaries not fully defeated

- an adversary simultaneously controlling or coercing the telecom/SMS provider, issuer, relay, gateway, civic service, and relevant network vantage points;
- a compromised participant device or browser;
- phone seizure, physical surveillance, or coerced disclosure by the participant;
- identification from writing style, personal details, unique knowledge, or attachment metadata;
- global timing analysis against small anonymity sets;
- denial of service, blocking, or the fact that a phone received an OTP.

These limitations must remain visible in user-facing copy.

## Principal attacks and required controls

| Attack | Required control | Residual risk |
| --- | --- | --- |
| Join issuer and civic tables | no shared IDs; blind issuance; separate operators and infrastructure | operator collusion |
| Correlate exact timestamps | broad issuance epochs, randomized delay, batching, coarse stored times | low traffic or global observer |
| Recover phones from hashes | never store deterministic unkeyed phone hashes; minimize retention; destroy rotation keys | issuer sees phone during verification |
| Link through IP logs | independently operated relay; sealed origin; no raw IP retention | relay/civic collusion or misconfiguration |
| Link through cookies/browser state | separate registrable domains and storage; no third-party scripts or shared telemetry | fingerprinting by network/browser |
| Serve malicious JavaScript | multi-party signed releases, reproducible native/extension client, transparency record, content security policy | convenience web client remains mutable |
| Identify through attachments | no attachments in v1; later client-side re-encoding and metadata stripping | visual/content clues remain |
| Build a cross-topic dossier | single-use or context-scoped credentials and nullifiers; no persistent public identity by default | content-based linkage |
| Founder compelled to disclose | founder lacks issuer access, relay control, joinable logs, and unilateral release power | prospective coercion of several operators |
| Silent future monitoring | two-person release approval, independent artifact verification, transparent builds and access | coordinated coercion |

## Privacy invariants to test

- Issuance messages contain no topic or civic identifier.
- Redemption messages contain no phone, auth user ID, issuer session, or stable cross-context identifier.
- Civic requests arriving at the origin contain no source IP header.
- Logs and traces reject sensitive fields by construction.
- A database snapshot from any one service cannot produce a phone-to-action mapping.
- A maintainer cannot deploy both issuer and civic changes alone.

This is a living model. Every architecture decision must name which adversary and invariant it affects.

