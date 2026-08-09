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

The issuer uses an `OTP_PROVIDER` adapter. `synthetic` is the mandatory default for local and public synthetic environments. `sentdm` is implemented for an explicitly approved low-stakes WhatsApp OTP trial and requires `SENTDM_API_KEY`, `SENTDM_TEMPLATE_ID`, and an independent `SENTDM_OTP_KEY` only inside the issuer trust domain. The older `prelude` adapter remains available as inactive reference code; it is not part of the WhatsApp-only launch path.

The Sent adapter generates a six-digit code inside the isolated issuer and sends only the E.164 phone number, approved template ID, code and the explicit `whatsapp` channel to Sent. It does not send civic identifiers, proposal or voting-round identifiers, IP/device signals, frontend dispatch identifiers, names or cross-service correlation IDs. It does not register a webhook or retain Sent message IDs. The client repeats the phone number during the code check so the issuer stores only a rotating keyed phone digest and HMAC of the short-lived OTP between requests; plaintext phone numbers and OTPs are not placed in challenge state, logs, databases or backups.

Before enabling `OTP_PROVIDER=sentdm`:

1. execute the DPA, subprocessor, EEA-hosting, access, deletion and retention review;
2. place the Sent and Meta/WhatsApp accounts and dashboards under the isolated issuer operator;
3. configure country allowlists, spend caps, retry delays and conservative fraud rules;
4. verify sender presentation and Albanian delivery on both ONE Albania and Vodafone Albania;
5. publish the temporary operator limitation and keep the credential protocol labelled synthetic;
6. verify that the approved template accepts the configured `SENTDM_CODE_PARAMETER` and sends through WhatsApp only;
7. retain an operational provider fallback through the adapter boundary rather than coupling the civic API to Sent.

The Albania trial records only aggregates by provider, carrier and test cohort: delivery within 10/30/60 seconds, completion rate, false blocks, messages per completion and cost per completion. It uses consenting test participants and never joins results to proposals or votes.

## Configuration invariants

- Keep `OTP_PROVIDER=synthetic` until the documented low-stakes WhatsApp trial gates are satisfied.
- Use independent values for `ISSUER_DIGEST_KEY`, `SYNTHETIC_SIGNING_KEY`, `TRANSPARENCY_SIGNING_KEY`, `ADMIN_API_KEY`, and `NOTIFICATION_ENCRYPTION_KEY`.
- Configure stable VAPID keys; the notification service refuses to start in production without them.
- Set `SOURCE_REVISION` to the deployed Git commit and rotate `TRANSPARENCY_KEY_EPOCH` with its signing key.
- Never expose PostgreSQL ports publicly or share database credentials across services.
