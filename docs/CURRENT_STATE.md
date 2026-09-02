# Current state

Verified: 2026-09-02 UTC

- Main at start of this checkpoint: `3f28afe` (Cloudflare migration merged after
  corpus checkpoint `46ddfe5`; always re-read current HEAD).
- Corpus: DN 34/34 full text; MN 152 catalog, local preservation still pending;
  SN 1,819 catalog, 358 verified local full texts, 1 verified missing Vietnamese,
  1 transient source failure queued for retry; AN canonical 1,408 discovered but
  catalog/full text pending; KN discovery pending.
- Hosting: Cloudflare preview verified at https://thu-vien-kinh-nikaya-preview.nhatkhoa-nikaya.workers.dev; production cutover remains blocked until an explicit production gate. Vercel remains current primary/backup candidate and is not retried while rate-limited.
- Locales: PR in progress for public `vi/th/my/si/km/lo/en/zh`; Pāli canonical;
  other UI locales deferred/noindex.
- Running next: scheduled resumable SN batches on GitHub Actions, then AN and KN
  catalog/materialization factories.
- Blocker: Cloudflare production has not been deployed; preview verification is complete.
