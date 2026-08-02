# Data model and forbidden joins

## Civic database

The civic database may store proposals, revisions, translations, structured arguments, voting rounds, anonymous ballot nullifiers, choices, ballot commitments, moderation cases, institutional responses, status history, and public audit events.

Evidence attached to proposals and arguments is a typed HTTPS citation (`source`, `document`, `image`, or `video`) with a title and optional publisher and publication date. The beta stores no uploaded media.

It must reject phone numbers, OTP codes, identity sessions, issuer session IDs, raw IP addresses, stable cross-proposal participant IDs, and request bodies in logs.

## Issuer database

The issuer stores an opaque challenge ID, a keyed phone digest, expiry and attempt count. Expired challenges are pruned. Plaintext numbers exist only in request memory and at the SMS processor. They are not written to application logs or backups. Key epochs and aggregate issuance controls remain part of the reviewed production protocol gate.

The synthetic issuer is not evidence that the real credential protocol is safe.

## Administration database

The administration database stores append-only actions by named moderators. Proposal content and moderation cases remain in the civic database and are accessed through a narrow internal API. Rejections, duplicates and every appeal require two distinct reviewers to submit the same decision.

## Notification database

The notification domain stores an endpoint hash, AES-GCM encrypted browser endpoint and keys, public category preferences, expiry and subscription timestamps. It stores no civic credential, phone number, ballot, proposal authorship or cross-domain identifier. Public publication events flow one way from moderation to this service.

## Writing assistant

Draft text and audio are processed ephemerally and are not retained. Only a participant-approved proposal or translation enters the civic database.

## Retention

Public civic decisions are retained for accountability. Rejected unpublished drafts follow the moderation retention policy. Issuer digests expire after their rate-limit and security window. Exact production periods require the legal and protocol reviews documented in the launch gate.
