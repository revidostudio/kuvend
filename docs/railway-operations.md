# Railway operations

Kuvend's public synthetic demo runs in the Railway project `Kuvend`, production environment, with six application services and four isolated Postgres services. The live configuration is intentionally split between versioned application deployment files and Railway environment settings.

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

`web`, `civic-api`, and all databases remain always on. `assistant`, `notifications`, and `admin` may sleep after inactivity. `issuer` may sleep only while OTP delivery and credentials are synthetic; keep it warm before any real OTP trial. Railway serverless sleeping is a container pause with a cold start, not a function runtime.

All services run one replica in EU West. Current measured memory is below 200 MB per application and 115 MB per database, so the demo caps are 0.5 GB for web and 0.25 GB for each Fastify/Postgres service. Reassess caps after load testing and before public promotion.

## Networking and domains

Browser requests use the six custom HTTPS domains. Server-side application calls and all database connections use Railway reference variables and private hostnames. Never replace a private reference with a rendered literal or `DATABASE_PUBLIC_URL`.

Cloudflare proxies the public domains. This is appropriate for the synthetic demo, but it is shared infrastructure and does not satisfy the independent-operator privacy model required for a sensitive pilot. Restrict `admin.kuvend.org` with Cloudflare Access once the allowed maintainer identities are explicitly selected.

## Production checks

After every infrastructure change:

1. Run `pnpm infra:check`.
2. Confirm all ten services report a successful deployment.
3. Confirm the six health URLs return HTTP 200.
4. Confirm browser CORS from `https://kuvend.org`.
5. Confirm custom-domain target ports match service `PORT` values.
6. Confirm only one EU West replica is active.
7. Inspect CPU and memory metrics for OOMs or sustained saturation.
8. Check that no full variable values appeared in logs or task output.

## Cost controls

The project consumes roughly 0.8 GB of steady memory before serverless sleeping, approximately $8–10/month at the audited rates. Railway bills at workspace level, so evaluate it alongside every other Revido project. The Revido workspace has a $175 soft usage alert and no hard limit; a hard limit could take unrelated production workloads offline.
