# Railway operations

Kuvend's experimental beta runs in the Railway project `Kuvend`, production environment, with six application services and four isolated Postgres services. The live configuration is intentionally split between versioned application deployment files and Railway environment settings.

The project also has a `staging` environment. Its six application services follow the GitHub `staging` branch and use Railway-generated domains. Production follows `main`. A release is pushed to `staging`, verified there, and then promoted as the same revision through a pull request to `main`.

## Versioned contract

- `apps/*/railway.json` owns Dockerfile selection, watch paths, deploy healthchecks, timeout, draining, and restart behavior.
- `.agents/skills/railway-kuvendi/references/deployment-contract.md` owns service IDs, domains, resource limits, serverless policy, and database mapping.
- `tooling/railway/check-config.mjs` prevents the six application configs from drifting.
- `.githooks/pre-commit` blocks common credential files and validates staged Railway configuration.

Install repository hooks once per clone:

```sh
pnpm setup:hooks
```

Validate the local contract:

```sh
pnpm infra:check
```

Audit live production without reading variable values:

```sh
node .agents/skills/railway-kuvendi/scripts/configure.mjs
```

Apply the versioned contract only after an explicitly authorized production change:

```sh
node .agents/skills/railway-kuvendi/scripts/configure.mjs --apply
```

The basic apply command safely retains `/` as the web healthcheck while the new web health route is not deployed. After all six `apps/*/railway.json` files and the web health route are present on GitHub `main`, activate the versioned config paths:

```sh
node .agents/skills/railway-kuvendi/scripts/configure.mjs --apply --activate-config
```

## Runtime policy

`web`, `civic-api`, `issuer`, and all databases remain always on. `assistant`, `notifications`, and `admin` may sleep after inactivity. Railway serverless sleeping is a container pause with a cold start, not a function runtime.

The `assistant` service uses `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_PRESET`, and `OPENROUTER_BASE_URL` for optional Albanian grammar and spelling correction. The privacy preset identifier `@preset/gdpr-and-zdr` does not select a model, so requests send `OPENROUTER_MODEL=openai/gpt-4o-mini` together with `OPENROUTER_PRESET=gdpr-and-zdr`. The request also requires ZDR at request time as a second routing constraint. Keep the key sealed in Railway. Placeholder values leave assistance unavailable and must produce an explicit UI error rather than a simulated correction.

All services run one replica in EU West. Current measured memory is below 200 MB per application and 115 MB per database, so the demo caps are 0.5 GB for web and 0.25 GB for each Fastify/Postgres service. Reassess caps after load testing and before public promotion.

## Networking and domains

Browser requests use the six custom HTTPS domains. Server-side application calls and all database connections use Railway reference variables and private hostnames. Never replace a private reference with a rendered literal or `DATABASE_PUBLIC_URL`.

Cloudflare proxies the public domains. This shared infrastructure does not satisfy the independent-operator privacy model required for stronger anonymity claims. `admin.kuvend.org` is protected by the Cloudflare Access application `Kuvend Admin`, using the existing `Rodrig only` allow policy. An unauthenticated request must redirect to the `little-surf-992e.cloudflareaccess.com` login page; it must never reach the Railway admin service directly.

## Production checks

After every infrastructure change:

1. Run `pnpm infra:check`.
2. Confirm all ten services report a successful deployment.
3. Confirm the five public health URLs return HTTP 200 and the admin health URL returns the expected Cloudflare Access login redirect.
4. Confirm browser CORS from `https://kuvend.org`.
5. Confirm custom-domain target ports match service `PORT` values.
6. Confirm only one EU West replica is active.
7. Inspect CPU and memory metrics for OOMs or sustained saturation.
8. Check that no full variable values appeared in logs or task output.

## Promotion workflow

1. Run the repository validation and privacy checks locally.
2. Push the candidate revision to the GitHub `staging` branch.
3. Wait for every affected staging deployment to succeed and verify staging health, CORS, and the public proposal flow.
4. Merge the candidate pull request to `main` without changing the tested revision.
5. Wait for every affected production deployment and repeat the production checks above.

## Cost controls

The project consumes roughly 0.8 GB of steady memory before serverless sleeping, approximately $8–10/month at the audited rates. Railway bills at workspace level, so evaluate it alongside every other Revido project. The Revido workspace has a $175 soft usage alert and no hard limit; a hard limit could take unrelated production workloads offline.
