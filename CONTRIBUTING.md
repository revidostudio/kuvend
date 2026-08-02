# Contributing

Kuvend is in a threat-model, reference-implementation, and protocol-design phase. The most useful early contributions are precise attacks, corrections to assumptions, protocol evaluations, operational designs, accessibility improvements, and clear explanations.

## Before opening code

1. Read the threat model and architecture.
2. State the threat or requirement being addressed.
3. Identify what new data, logs, identifiers, keys, or trusted parties the change introduces.
4. Prefer a small architecture decision record before a large implementation.

Security-critical cryptography must be based on a reviewed standard or established library. A pull request must not describe an unaudited prototype as anonymous, secure, coercion-resistant, or production-ready.

## Decision records

Use `docs/adr/NNNN-short-name.md` with context, decision, consequences, alternatives, and unresolved questions. Decisions that weaken a privacy boundary require explicit maintainer and security review.

## Conduct

Discuss systems and evidence, not personal motives. Do not post phone numbers, identity records, private submissions, exploit details affecting a live deployment, or information that could identify a participant.

Report vulnerabilities according to [SECURITY.md](SECURITY.md).
