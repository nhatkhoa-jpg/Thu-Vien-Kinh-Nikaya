# Permanent Work directive

## Source of truth

- GitHub `main` is the only authoritative project state. Read current HEAD,
  relevant CI results, and `data/status/corpus-status.json` before acting.
- Never reset or force-push `main`, overwrite newer work, or merge a diverged
  branch without reconciling and testing it.

## Operating model

**Work designs the factory; GitHub Actions, Python, Node, and Cloudflare run it.**

Use Work for architecture, general scripts, difficult failures, integrity,
security, source/rights decisions, conflict resolution, review, and safe merge.
Do not use Work to fetch/read/hash/upload individual scriptures, render audio,
poll jobs, or repeat any operation that a resumable workflow can perform.

Long pipelines must checkpoint verified results, skip valid hashes, retry with
backoff, isolate failures, resume without redoing good records, expose artifacts
and status, and use concurrency locks. A failed item must not discard a batch.
On failure, inspect the exact failing step, make the smallest patch, and resume.

## Product and corpus rules

- Corpus first: canonical discovery → provenance/rights → catalog → source-backed
  local full text → search/reader/PDF/RAG → build/smoke. Audio is independent.
- Never invent canonical UIDs, titles, translations, translators, metadata, or
  scripture text. Preserve canonical range UIDs exactly.
- Pāli is the canonical identity/source layer. Preferred Vietnamese source is
  Thích Minh Châu when available and lawful. Missing translations are explicit.
- Public UI locales: `vi`, `th`, `my`, `si`, `km`, `lo`, `en`, `zh`. Pāli is not
  a required UI locale. Other locales are deferred/noindex but remain recoverable.
- UI localization may use machine assistance with QA. Scripture translations
  must always carry provider, translator, URL, language, rights note, timestamp,
  and content hash; AI must never masquerade as an official translation.

## Hosting and preservation

- Cloudflare Workers + Static Assets is the planned production; deploy only on
  deliberate milestones, not every corpus checkpoint. Vercel remains a mirror.
- No paid upgrade, domain purchase, or cost without explicit user permission.
- Audio stays outside application deploys: versioned manifest → small MP3
  segments → checksummed fallback mirrors.
- GitHub stores source, metadata, manifests, checksums, workflows, and restore
  instructions. Internet Archive and Hugging Face are future public mirrors when
  credentials and rights permit.

## Reporting

Update `docs/CURRENT_STATE.md` only at milestones. Report to the user briefly as
DONE / VERIFIED / RUNNING / BLOCKER. Ask only for missing credentials, payment,
material legal ambiguity, or irreversible/destructive action.

