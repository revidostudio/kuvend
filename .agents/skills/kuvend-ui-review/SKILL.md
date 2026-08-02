---
name: kuvend-ui-review
description: Review Kuvend UI changes for design-system compliance, Tailark provenance, accessibility, mobile responsiveness, visual regressions, interaction behavior, and privacy-safe browser code. Use before completing or approving any UI change.
---

# Kuvend UI Review

Review the actual rendered UI and the diff. Do not approve from source inspection alone.

## Review sequence

1. Read `references/review-checklist.md`.
2. Run `pnpm design:check` and its fixture tests.
3. Run typecheck and relevant Vitest/axe suites.
4. Render at 320×568, 390×844, 412×915, 768×1024, and 1440×900 in Chromium; run critical flows in WebKit.
5. Check overflow, 44px targets, focus order, accessible names, labels/errors, dialogs/drawers, reduced motion, 200% zoom, long Albanian content, safe areas, and mobile back navigation.
6. Compare screenshots to approved baselines. Never regenerate baselines to hide a regression.
7. Report findings by file and severity. A serious accessibility, privacy, mobile, or visual finding blocks completion.
