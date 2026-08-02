# Tailark update procedure

The approved registry is `@tailark-oss = https://oss.tailark.com/r/{name}.json`; Mist OSS only.

1. Run the shadcn CLI dry-run for the exact Mist item.
2. Save or inspect its diff; do not use overwrite mode.
3. Compare upstream behavior to owned source and record the upstream item in the change description.
4. Reimplement only useful structure using Kuvend tokens, 44px targets, Base UI semantics, focus behavior, and mobile rules.
5. Remove demo logos, copy, animation, external assets, and tracking.
6. Add/update stories, interaction tests, and the registry provenance file.
