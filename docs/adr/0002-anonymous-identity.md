# ADR 0002: Keep conventional auth out of anonymous participation

- Status: accepted as a design constraint
- Date: 2026-08-02

## Context

Conventional authentication frameworks are designed around stable users, sessions, recovery, audit events, and provider metadata. Those features are useful for administration but create linkable records that conflict with anonymous participation.

## Decision

Better Auth or another conventional framework may serve maintainers and explicitly nonanonymous features only. Anonymous proposals and votes use a narrowly scoped, separately deployed credential issuer built from an established anonymous-token standard and reviewed cryptographic library. The project will not implement custom cryptographic primitives.

## Consequences

The system cannot reuse ordinary account sessions for proposals or votes. User experience and abuse controls require additional design. The boundary is easier to inspect, and compromise of the administration account database does not directly identify anonymous civic actions.
