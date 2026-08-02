# Open Civic

Open Civic is an early-stage, noncommercial public-good project for private civic proposals and voting. Its central design goal is narrow and demanding:

> The project must not possess, and no project operator should be able to reconstruct, the link between a verified phone number and a proposal or vote.

This repository begins with the threat model and trust boundaries before application code. It does **not** yet provide a safe production system.

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

See [Architecture](docs/architecture.md), [Threat model](docs/threat-model.md), and [Roadmap](docs/roadmap.md).

## Why Better Auth is not in the anonymous path

Better Auth can be useful for maintainers, sponsor administration, and explicitly nonanonymous profiles. The anonymous participation path should use a small independent issuer because normal account systems intentionally create stable users, sessions, and event records. See [ADR 0002](docs/adr/0002-anonymous-identity.md).

## Project stage

The current milestone is **Phase 0: make the promises precise**. Before accepting real phone numbers or civic submissions, the project needs:

1. a reviewed adversary and data-flow model;
2. a standards-based credential protocol selection;
3. a reference implementation with privacy-boundary tests;
4. independent operators for issuer, relay, and civic service;
5. external cryptographic, application-security, and operational review.

Do not deploy this repository for sensitive participation yet.

## Development

There is intentionally no production application scaffold yet. Start by reviewing the open design questions in the roadmap and proposing changes through issues or pull requests. Code will be added only after the protocol boundary is accepted.

## Governance and funding

[CHARTER.md](CHARTER.md) records the permanent noncommercial promise and separates money from influence. [CONTRIBUTING.md](CONTRIBUTING.md) explains how decisions are made during the founding phase.

## License

Copyright (c) 2026 Open Civic contributors. Licensed under the [GNU Affero General Public License v3.0](LICENSE).
