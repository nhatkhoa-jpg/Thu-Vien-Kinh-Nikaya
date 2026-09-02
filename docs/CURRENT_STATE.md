# Current state

Verified: 2026-09-02 UTC

- Main changes continuously; always re-read current HEAD before starting work.
- Corpus: DN 34/34 full text; MN 152 catalog, local preservation still pending;
  SN 1,819 catalog, 358 verified local full texts, 1 verified missing Vietnamese,
  1 transient source failure queued for retry; AN canonical 1,408 discovered but
  catalog/full text pending; KN discovery pending.
- Hosting: Cloudflare production is verified and live at https://thu-vien-kinh-nikaya.nhatkhoa-nikaya.workers.dev. Full production smoke passed after real deployment. Cloudflare is now the primary production host; Vercel is retained only as an optional backup/mirror and must not be retried while rate-limited.
- Hosting operations are owned by the `ops/chatgpt-*` lane. Work/Codex should not modify Cloudflare production workflows, secrets, release gating, or hosting state unless explicitly handed over.
- Locales: public target set is `vi/th/my/si/km/lo/en/zh`; Pāli canonical;
  other UI locales deferred/noindex.
- Running next: scheduled resumable SN batches on GitHub Actions, then AN and KN
  catalog/materialization factories. Cloudflare production health is checked automatically every hour.
- Hosting blocker: none. Any corpus/content blockers are tracked by the Work/Codex lane.
