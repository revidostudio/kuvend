# Tailark Mist OSS provenance

Registry: `https://oss.tailark.com/r/{name}.json`

Reviewed scaffolds: `mist-hero-section-1`, `mist-footer-1`.

Reviewed primitives: `mist-button`, `mist-card`, `mist-field`, `mist-input`, `mist-label`, `mist-select`, `mist-separator`, `mist-textarea`, `mist-toggle`, `mist-toggle-group`.

On 3 August 2026, `mist-button` was reviewed again via a shadcn CLI dry-run. Kuvend adopted its medium label weight, rounded-xl geometry, compact icon spacing, outline ring/shadow treatment and brightness-based interaction model while retaining 44px mobile targets and owned semantic gradients.

Kuvend owns the normalized implementation in `packages/ui`. Demo copy/assets and upstream control dimensions were not retained. The owned controls use semantic tokens, minimum mobile targets, visible focus, Base UI behavior, and Kuvend-specific privacy/product patterns.
