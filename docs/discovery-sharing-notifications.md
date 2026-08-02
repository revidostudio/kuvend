# Discovery, sharing and notifications

## Search and sharing

- Every accepted proposal has a stable `/propozime/{id}` URL, canonical metadata and an indexable Albanian title and summary.
- The site publishes `robots.txt`, `sitemap.xml`, RSS and organization structured data.
- Proposal pages have Open Graph and Twitter metadata. Share actions use the device share sheet and fall back to copying the canonical URL.
- Albanian remains canonical. Future English pages must use `hreflang` and link back to the authoritative Albanian revision.
- Closed results remain at the same URL. Status changes must not break incoming links.
- Public previews never include capability secrets, ballot receipts, phone-verification state or unpublished moderation content.

## Notifications

Browser push is operated as a separate trust domain. It stores a push endpoint, browser-provided keys and optional public topic preferences. It accepts no phone number, credential, proposal, argument, ballot, nullifier or civic participant identifier.

Only public events may be sent: a proposal opening, a documented closing extension, a closed result or an institutional response. Subscription does not create a civic profile or establish voting eligibility. RSS is the no-registration alternative.

The reference service now provides durable encrypted PostgreSQL storage, topic updates, unsubscribe handling, stable-key enforcement in production, and expiry pruning before delivery. Production still requires provider-level delivery-rate limits and a scheduled retention job. Notification opens must not include tracking parameters and must not be joined to civic analytics.
