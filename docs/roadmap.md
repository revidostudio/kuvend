# Roadmap

## Phase 0 — promises before code

- define user stories and jurisdiction-independent requirements;
- obtain review of the threat model from cryptography, privacy, abuse, and local civil-society practitioners;
- decide whether phone verification is required at all for each action;
- evaluate standardized anonymous-token and oblivious-relay protocols;
- specify retention, key destruction, batching, and minimum anonymity-set rules;
- publish governance, funding, and country-operator requirements.

Exit condition: a written protocol and operational design with named assumptions, reviewed by people independent of the implementation.

## Phase 1 — local reference system

- protocol test vectors and a minimal credential issuer;
- privacy relay/gateway development setup;
- civic proposal and vote services with separate databases;
- synthetic SMS adapter only; no real identities;
- privacy-boundary, log-scrubbing, duplicate-use, and failure-path tests;
- a command that demonstrates the entire flow locally with fake data.

Exit condition: automated tests show the intended separation, and the repository still states that the implementation is unaudited.

## Phase 2 — hardened pilot

- reproducible signed client;
- independent operators and infrastructure accounts;
- production key custody and two-person access;
- third-party protocol, application, infrastructure, and privacy review;
- red-team exercises for timing, logging, backups, malicious releases, and moderation leakage;
- small invitation-only pilot using non-sensitive prompts.

Exit condition: published audit findings are resolved or explicitly accepted, and incident response has been rehearsed.

## Phase 3 — country launch kit

- instance manifest and localization system;
- documented SMS, email, passkey, and national-ID eligibility adapters kept outside the anonymous action path;
- Docker Compose plus reviewed deployment templates;
- public instance directory, transparency reports, and signed release channel;
- contributor attribution and GitHub Sponsors reporting.

## Questions that must remain open for now

- Is phone-based eligibility worth the telecom metadata and exclusion it creates?
- What anonymity-set size and delay are acceptable for urgent proposals?
- Who can operate the issuer, relay, and gateway independently in the first country?
- How should eligibility revocation work without enabling linkage?
- Which abuse controls remain compatible with anonymous participation?
- What moderation evidence can be retained without creating authorship clues?
