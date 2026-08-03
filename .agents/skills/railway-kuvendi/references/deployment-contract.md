# Kuvend Railway deployment contract

## Scope and IDs

- Project: `Kuvend`
- Project ID: `4739a763-6d33-475d-877c-1b8535e2bcbe`
- Environment: `production`
- Environment ID: `aa1a25b6-d4b8-4896-84ed-d643ffee6fcf`
- GitHub source: `revidostudio/kuvend`, branch `main`, check suites enabled
- Region: EU West (`europe-west4-drams3a`), one replica per service
- Revido workspace usage control: $175 soft alert, no hard shutdown limit
- Admin access: Cloudflare Access application `Kuvend Admin`, application ID `8bded81b-6faf-4ee5-ab1b-f587df90a794`, policy `Rodrig only`

| Service         | ID                                     | Public domain              | Port | Serverless          | Limit              |
| --------------- | -------------------------------------- | -------------------------- | ---: | ------------------- | ------------------ |
| `web`           | `80908e70-6f04-4e6d-8cb4-8028f3740f1d` | `kuvend.org`               | 3000 | no                  | 1 vCPU / 0.5 GB    |
| `civic-api`     | `bf1f4f79-b7f6-4565-9caf-eb4063d8cd8a` | `api.kuvend.org`           | 4000 | no                  | 0.5 vCPU / 0.25 GB |
| `issuer`        | `3e12935b-e5d3-4dfd-8205-7173fec44e9b` | `issuer.kuvend.org`        | 4001 | synthetic demo only | 0.5 vCPU / 0.25 GB |
| `assistant`     | `21235006-1348-4d2c-a118-451057ece264` | `assistant.kuvend.org`     | 4002 | yes                 | 0.5 vCPU / 0.25 GB |
| `admin`         | `4815cd9b-0723-40b9-abd5-ee793345a805` | `admin.kuvend.org`         | 4003 | yes                 | 0.5 vCPU / 0.25 GB |
| `notifications` | `fa306d00-8478-4c7e-a575-d59ee9fcf424` | `notifications.kuvend.org` | 4004 | yes                 | 0.5 vCPU / 0.25 GB |

## Staging promotion gate

- Environment: `staging`
- Environment ID: `91b9664d-3a75-482c-ac22-196a13bf7d53`
- GitHub source: `revidostudio/kuvend`, branch `staging`
- Staging uses Railway-generated domains only; it has no production custom domains.
- Application domains are `web-staging-7bb7.up.railway.app`, `civic-api-staging.up.railway.app`, `issuer-staging-f1ff.up.railway.app`, `assistant-staging-d844.up.railway.app`, `admin-staging-ac1b.up.railway.app`, and `notifications-staging-69b8.up.railway.app`.
- Promote the exact tested revision by merging its pull request to `main`; never point production at the `staging` branch.

## Database mapping

| Trust domain   | Railway service | ID                                     | Limit              |
| -------------- | --------------- | -------------------------------------- | ------------------ |
| civic          | `Postgres`      | `8354c788-3a56-4485-8aa7-ad52c6cbbcf5` | 0.5 vCPU / 0.25 GB |
| issuer         | `Postgres-REmA` | `7fa5ec96-d615-4a2d-b6a6-afc8e9d46e22` | 0.5 vCPU / 0.25 GB |
| notifications  | `Postgres-6m7Z` | `0454a4df-61b4-4321-bce1-e77889d6a6ad` | 0.5 vCPU / 0.25 GB |
| administration | `Postgres-htSR` | `8b82ccf7-90a7-4bfc-ba92-c96c65b12fb7` | 0.5 vCPU / 0.25 GB |

Database services stay always on, have one persistent volume each, and expose no custom HTTP domain. Application `DATABASE_URL` values must remain Railway reference variables to the correct database service.

## Application configuration

Each application keeps a blank Railway root directory and uses its absolute config path:

- `/apps/web/railway.json`
- `/apps/civic-api/railway.json`
- `/apps/issuer/railway.json`
- `/apps/assistant/railway.json`
- `/apps/notifications/railway.json`
- `/apps/admin/railway.json`

The files own Dockerfile paths, watch patterns, deploy healthchecks, 60-second healthcheck timeouts, 10-second drain windows, and on-failure restart policy. Serverless and replica resource limits remain live environment settings and are enforced by `scripts/configure.mjs`.

The public admin healthcheck is intentionally intercepted by Cloudflare Access. Treat an HTTP 302 redirect from `admin.kuvend.org` to `little-surf-992e.cloudflareaccess.com` as healthy; do not weaken or bypass Access to obtain a public HTTP 200.

## Privacy and promotion gates

This single project is acceptable only for the public synthetic demo. Before a sensitive pilot, move issuer and civic domains to independently controlled cloud accounts, operators, databases, logs, keys, monitoring, and release authority. Disable issuer serverless for any real OTP trial. Do not represent custom subdomains inside one Railway project as independent operation.
