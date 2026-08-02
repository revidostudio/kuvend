---
name: kuvend-ui
description: Create or change Kuvend public or admin UI, styling, assets, responsive behavior, Storybook stories, or frontend dependencies using the owned Tailark Mist, shadcn, and Base UI design system. Use for every implementation task that affects browser UI.
---

# Kuvend UI

Build from mobile upward using `@kuvend/ui`. Read the references relevant to the change before editing.

## Workflow

1. Read `references/component-decision-tree.md`, `references/token-contract.md`, and `references/mobile-ux.md`.
2. Inspect existing patterns and stories before adding a component.
3. Compose a Kuvend pattern; if none fits, compose an owned primitive; add a primitive only as a last resort.
4. For Tailark updates, follow `references/tailark-updates.md`. Never accept registry output without a dry-run and review.
5. Use real Albanian copy and include loading, empty, error, disabled, long-text, and narrow-screen states.
6. Preserve product/privacy contracts. Never introduce identity sessions, phone fields into civic payloads, external browser SDKs, or behavioral analytics.
7. Run `pnpm design:check`, typecheck, component tests, and the relevant Playwright mobile project.
8. Invoke `kuvend-ui-review` before completion.

## Completion criteria

- No horizontal overflow at 320px or 200% zoom.
- Interactive targets are at least 44×44 CSS pixels on mobile.
- Keyboard order, focus, names, labels, errors, and overlays are accessible.
- Only semantic tokens are used; no raw colors or feature-level primitive restyling.
- Mobile flow is complete before desktop enhancement.
