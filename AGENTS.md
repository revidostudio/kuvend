# Kuvend agent rules

Any change touching UI, CSS, images, icons, browser-facing copy, frontend dependencies, Storybook, or visual tests MUST use the repository skill `.agents/skills/kuvend-ui/SKILL.md` before editing and `.agents/skills/kuvend-ui-review/SKILL.md` before completion.

`@kuvend/ui` is the only source of tokens, interactive primitives, and shared public/admin patterns. Mobile at 320px is the canonical layout. Preserve civic API, credential, ballot, privacy, and database contracts unless the task explicitly changes them.

Before handing off UI work run `pnpm design:check`, `pnpm typecheck`, the relevant component tests, and the mobile Playwright project. Never overwrite Tailark registry output directly; inspect a CLI dry-run/diff and normalize it into owned source.

Any task that inspects or changes Railway services, domains, variables, deploys, capacity, spend, or production configuration MUST use `.agents/skills/railway-kuvendi/SKILL.md`. Run `pnpm infra:check` before completing infrastructure changes.

Treat the Railway project and production environment as sensitive shared state. Read before writing; resolve exact service IDs; never print full variable collections or resolved connection strings; never use `railway up` for production; and never delete, unlink, rename, scale, restart, redeploy, or mutate production without an explicit task that authorizes that operation. Keep browser URLs public and all server-to-server/database traffic on Railway private networking.

The repository root is the build context for every application service. Do not set per-app Railway root directories: the pnpm workspace and Dockerfiles require root manifests and shared packages. Keep service-specific deployment behavior in `apps/*/railway.json`, and keep their paths, resource limits, serverless policy, domains, and IDs synchronized with `docs/railway-operations.md` and the Railway skill.
