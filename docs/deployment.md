# Deployment

## Local reference system

`docker compose up --build` starts web, civic API, synthetic issuer, writing assistant, notification service, moderation service, and four separate PostgreSQL databases. The local credential is deliberately synthetic. Copy `.env.example` only as a reference; replace every development secret before any shared environment.

The civic database stores public participation records. The issuer database stores expiring OTP challenge IDs, keyed phone digests and attempt counters. The administration database stores append-only access and action audits. The notification database stores endpoint hashes plus AES-GCM encrypted subscription payloads. There is no cross-database identifier.

The local administrator is at `http://localhost:4003` and uses the development `ADMIN_API_KEY`. This is explicitly a synthetic control and must be replaced by passkey/MFA authentication before a sensitive pilot.

## Public synthetic demo

The demo may use a single Railway project in a European region with separately credentialed services and databases. It must contain no real identity data and display the synthetic status.

Suggested demo origins are `kuvend.org`, `api.kuvend.org`, `verify.kuvend.org`, and `admin.kuvend.org`. These subdomains are not sufficient separation for a real privacy claim.

The browser-facing APIs allow localhost and `kuvend.org` origins by default. Temporary preview origins must be listed explicitly in the comma-separated `CORS_ALLOWED_ORIGINS` variable on the civic API, issuer, assistant, and notification services; do not use a wildcard origin. Web-to-service calls use public HTTPS origins, while server-to-service calls and all database connections use Railway private networking and reference variables.

## Sensitive pilot

The issuer, relay, gateway, civic service, databases, logging, keys, monitoring, backups, accounts, and release authority are separated as described in the architecture. The civic origin accepts traffic only from the OHTTP gateway. No shared trace ID crosses a privacy boundary.

The launch gate requires an independent issuer operator, independent cryptographic and operational review, three maintainers, two-person production approval, a legal review, and a rehearsed incident response.

## OTP provider selection

The issuer uses an `OTP_PROVIDER` adapter. `synthetic` is the mandatory default for local and public synthetic environments. `prelude` is implemented for an explicitly approved low-stakes OTP trial and requires `PRELUDE_API_KEY` only inside the issuer trust domain.

The Prelude adapter sends only the E.164 phone number and six-digit-code configuration to Verify v2. It does not send civic identifiers, proposal or voting-round identifiers, metadata, IP/device signals, frontend dispatch identifiers, or cross-service correlation IDs. The client repeats the phone number during the code check so the issuer stores only a rotating keyed digest between requests; plaintext is not placed in challenge state, logs, databases, or backups.

Before enabling `OTP_PROVIDER=prelude`:

1. execute the DPA, subprocessor, EEA-hosting, access, deletion and retention review;
2. place the Prelude account and dashboard under the isolated issuer operator;
3. configure country allowlists, spend caps, retry delays and conservative fraud rules;
4. verify sender presentation and Albanian delivery on both ONE Albania and Vodafone Albania;
5. publish the temporary operator limitation and keep the credential protocol labelled synthetic;
6. retain an operational provider fallback through the adapter boundary rather than coupling the civic API to Prelude.

The Albania trial records only aggregates by provider, carrier and test cohort: delivery within 10/30/60 seconds, completion rate, false blocks, messages per completion and cost per completion. It uses consenting test participants and never joins results to proposals or votes.

## Configuration invariants

- Keep `OTP_PROVIDER=synthetic` unless a low-stakes trial has been explicitly approved.
- Use independent values for `ISSUER_DIGEST_KEY`, `SYNTHETIC_SIGNING_KEY`, `TRANSPARENCY_SIGNING_KEY`, `ADMIN_API_KEY`, and `NOTIFICATION_ENCRYPTION_KEY`.
- Configure stable VAPID keys; the notification service refuses to start in production without them.
- Set `SOURCE_REVISION` to the deployed Git commit and rotate `TRANSPARENCY_KEY_EPOCH` with its signing key.
- Never expose PostgreSQL ports publicly or share database credentials across services.
