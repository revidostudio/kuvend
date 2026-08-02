# ADR 0001: Separate identity from civic participation

- Status: accepted as a design constraint
- Date: 2026-08-02

## Context

A service that both verifies phone numbers and receives civic actions can correlate them through database identifiers, cookies, IP addresses, timing, telemetry, or privileged access. Deleting a foreign key does not remove these channels.

## Decision

Identity issuance, relay/gateway transport, and civic participation are distinct security and operational domains. They use separate operators, infrastructure accounts, domains, databases, keys, logs, release authority, and monitoring. Issuance is blind and topic-agnostic. Redemption uses no identity session and reaches a sealed civic origin only through the privacy path.

## Consequences

Deployment is harder and costs more than a modular monolith. Local development must simulate multiple services. Operational collusion and low-volume timing attacks remain risks. In exchange, a founder controlling only the civic project cannot answer a retrospective request with a phone-to-action mapping because the project never creates one.

