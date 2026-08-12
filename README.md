# Kuvend

Kuvend is an early-stage, independent, noncommercial public-good project for private civic proposals and advisory voting concerning Albania. Its central design goal is narrow and demanding:

> The project must not possess, and no project operator should be able to reconstruct, the link between a verified phone number and a proposal or vote.

This repository begins with the threat model and trust boundaries before application code. It does **not** yet provide a safe production system.

The public product will live at **kuvend.org**. It is independent and is not affiliated with the Assembly of Albania, a political party, or a government institution.

## Non-negotiable commitments

- No subscriptions, advertising, paid features, data sales, or sponsor influence.
- Financial support pays shared project costs only and is disclosed publicly.
- Labor is credited separately from financial sponsorship.
- Independent deployments own their data, policies, providers, and infrastructure.
- Anonymous participation does not share sessions, identifiers, logs, or infrastructure accounts with identity verification.
- Privacy claims cover what the system can technically guarantee; they do not promise protection from compromised devices, writing-style identification, or a global network adversary.
- Security-critical protocol work must use established standards and independent review. We will not invent cryptography.

## Proposed system

```text
phone verification -> independent credential issuer -> blinded, one-time credential
                                                        |
user client -> independent relay -> batch gateway -> civic service
                                                        |
                                             proposal or topic-nullified vote
```

The issuer may learn that a phone was verified. The civic service may learn a proposal or vote. Neither service should receive enough information to join those facts. A separately operated relay hides the participant's network address from the civic service, while batching reduces simple timing correlation.

See the [Product specification](docs/product-spec.md), [Architecture](docs/architecture.md), [Threat model](docs/threat-model.md), [launch review packet](docs/launch-review.md), and [Roadmap](docs/roadmap.md).

## Why Better Auth is not in the anonymous path

Better Auth can be useful for maintainers, sponsor administration, and explicitly nonanonymous profiles. The anonymous participation path should use a small independent issuer because normal account systems intentionally create stable users, sessions, and event records. See [ADR 0002](docs/adr/0002-anonymous-identity.md).

## What is implemented

The current milestone is an **experimental end-to-end beta**. It includes:

- a modern, mobile-first Next.js PWA built with shadcn/ui;
- a six-step proposal wizard with optional AI review, duplicate suggestions, structured evidence links, a final review, and explicit confirmation;
- proposal moderation, structured arguments, final Support/Oppose voting, inclusion receipts, and public result tracking;
- private author-capability workflows for revision, withdrawal, appeal, and recovery-secret download;
- a separate moderation dashboard with two-person high-risk decisions, institutional response tracking, and append-only administrator audits;
- strict civic API schemas that reject phone numbers and stable participant identifiers;
- isolated WhatsApp verification and Semaphore membership issuance, assistant, administration, and notification services;
- an issuer-only Sent adapter for a reviewed WhatsApp OTP trial, with provider credentials confined to the issuer trust domain;
- proposal metadata, social preview images, a sitemap, robots policy, and an RSS feed for discovery and sharing;
- encrypted, durable web-push subscriptions with topic selection and unsubscribe, without joining notification data to civic identities;
- PostgreSQL-backed civic records and isolated, expiring OTP challenge digests, with in-memory adapters retained for deterministic tests.

Before accepting real phone numbers or civic submissions, the project still needs:

1. a reviewed adversary and data-flow model;
2. a standards-based credential protocol selection;
3. a reference implementation with privacy-boundary tests;
4. independent operators for issuer, relay, and civic service;
5. external cryptographic, application-security, and operational review.

Do not deploy this repository for sensitive participation yet. Sent can verify control of a phone number, but the anonymous credential remains a development adapter rather than a reviewed production privacy protocol. Start an independent assessment with the [launch review packet](docs/launch-review.md).

## Development

The repository contains a real anonymous-membership implementation based on Semaphore V4. The integration is experimental and still requires independent cryptographic, privacy, and operational review before Kuvend makes stronger anonymity assurances.

```bash
corepack enable
pnpm install
pnpm dev
```

For the full service topology, use `docker compose up --build`. See [Deployment](docs/deployment.md).

## Governance and funding

[CHARTER.md](CHARTER.md) records the permanent noncommercial promise and separates money from influence. [CONTRIBUTING.md](CONTRIBUTING.md) explains how decisions are made during the founding phase.

## License

Copyright (c) 2026 Kuvend contributors. Licensed under the [GNU Affero General Public License v3.0](LICENSE).
