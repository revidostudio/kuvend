# Component decision tree

1. Is it a full civic behavior? Use or extend a pattern: `AppShell`, `ProposalCard`, `TrustNotice`, `Wizard`, voting/evidence/status/empty patterns.
2. Is it an interaction found across features? Use an existing `@kuvend/ui` primitive.
3. Is Base UI appropriate? Wrap it inside `packages/ui`; never import Base UI in an app.
4. Does Mist supply it? Inspect `@tailark-oss` with a shadcn CLI dry-run, then normalize accessibility, tokens, targets, and responsive behavior into owned source.
5. Otherwise build the smallest accessible owned primitive and add tests/stories.

Feature files may compose and position components. They may not redefine primitive borders, colors, focus, radii, or control heights.
