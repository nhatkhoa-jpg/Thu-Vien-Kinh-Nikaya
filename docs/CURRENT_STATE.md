# Current state

Verified: 2026-09-02 UTC

- Main at start of this checkpoint: `3f28afe` (Cloudflare migration merged after
  corpus checkpoint `46ddfe5`; always re-read current HEAD).
- Corpus: DN 34/34 full text; MN 152 catalog, local preservation still pending;
  SN 1,819 catalog, 358 verified local full texts, 1 verified missing Vietnamese,
  1 transient source failure queued for retry; AN canonical 1,408 discovered but
  catalog/full text pending; KN discovery pending.
- Hosting: Cloudflare adapter/build/dry-run gates merged; Worker gzip 1.922 MiB;
  preview deployment awaits scoped Cloudflare credentials. Vercel remains backup
  and must not be retried while rate-limited.
- Locales: PR in progress for public `vi/th/my/si/km/lo/en/zh`; Pāli canonical;
  other UI locales deferred/noindex.
- Running next: scheduled resumable SN batches on GitHub Actions, then AN and KN
  catalog/materialization factories.
- Blocker: Cloudflare preview needs `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` (or connected Cloudflare authorization).
