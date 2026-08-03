---
name: railway-kuvendi
description: Audit, configure, deploy, troubleshoot, and control cost for the Kuvend Railway project. Use for any task involving Kuvend Railway services, GitHub deployment triggers, custom domains, healthchecks, watch paths, root directories, resource limits, serverless sleeping, Postgres services, private networking, logs, metrics, variables, redeploys, or production infrastructure drift.
---

# Railway Kuvendi

Operate the linked `Kuvend` Railway project without crossing its privacy boundaries or exposing secrets.

## Workflow

1. Read `references/deployment-contract.md` before changing live configuration.
2. Run `pnpm infra:check` to validate the repository contract.
3. Run `node .agents/skills/railway-kuvendi/scripts/configure.mjs` for a read-only live audit.
4. Compare the requested action with the service policy. Resolve project, environment, and service IDs before every mutation.
5. Use `node .agents/skills/railway-kuvendi/scripts/configure.mjs --apply` only when the user explicitly authorizes applying the live contract to production.
6. After the config files are present on GitHub `main`, activate their paths with `--apply --activate-config`. Never activate a file path that is absent from the deployed commit.
7. Verify deployment status, resource limits, domains, health endpoints, and browser CORS after a mutation.
8. Update the reference, `docs/railway-operations.md`, and the relevant `apps/*/railway.json` together when the contract changes.

## Safety rules

- Treat full Railway variable output as secret. Query names or an explicit non-secret allowlist only.
- Keep the repository root as every application build context. Do not set per-app root directories.
- Deploy production through GitHub `main`; do not use `railway up`.
- Keep browser calls on custom HTTPS domains and server/database calls on `*.railway.internal` reference variables.
- Keep the four Postgres trust domains separate. Do not consolidate or expose their TCP endpoints for convenience.
- Keep `admin.kuvend.org` behind the `Kuvend Admin` Cloudflare Access application and the `Rodrig only` policy. Its expected public health result is the Access login redirect, not an unauthenticated HTTP 200.
- Do not delete, unlink, rename, restart, redeploy, scale, rotate secrets, or change domains unless the task explicitly authorizes that operation.
- Do not enable real OTP delivery or accept sensitive civic participation; this repository remains a synthetic demo.
- Preserve one replica in EU West until measured traffic demonstrates a need to scale.
- Keep `web`, `civic-api`, and Postgres always on. Serverless is allowed for `issuer`, `assistant`, `notifications`, and `admin` only while the environment is synthetic.

## Common operations

- Audit local contract: `pnpm infra:check`
- Audit live production: `node .agents/skills/railway-kuvendi/scripts/configure.mjs`
- Apply authorized contract: `node .agents/skills/railway-kuvendi/scripts/configure.mjs --apply`
- Activate shipped config paths: `node .agents/skills/railway-kuvendi/scripts/configure.mjs --apply --activate-config`
- Service status: `railway service status --all --json`
- Recent logs: `railway logs -s <service> --lines 200`
- Metrics: `npx -y @railway/cli@5.30.3 metrics --all --since 6h --json`
- Health: request the exact URLs in `references/deployment-contract.md`; never infer a domain from a generated service name.

After any live change, inspect the returned GraphQL errors and stop on partial failure. Never report success from HTTP status alone.
