# Cloudflare R2 media storage

Bucket: `nikaya-media`

The bucket is intentionally private. Public access must remain disabled until the application has a reviewed delivery path (Worker binding, controlled proxy, or deliberate public/custom-domain policy).

## Canonical key layout

- `audio/<collection>/<canonical-ref>/...`
- `pdf/<collection>/<canonical-ref>/...`
- `manifests/audio/<collection>/<canonical-ref>.json`
- `manifests/pdf/<collection>/<canonical-ref>.json`
- `archive/<release-or-snapshot>/...`
- `checksums/<release-or-snapshot>/SHA256SUMS`
- `ops/health/...` temporary connectivity probes only

Do not use bucket folders as canonical scripture identifiers. Canonical refs and repository manifests remain the source of truth.

## Credentials

GitHub Actions uses repository secrets only:

- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ACCOUNT_ID`

Never commit credentials, endpoint tokens, or secret values.

## Publishing safety

Use `scripts/r2_sync.py` for managed uploads. It:

1. calculates SHA-256 for every local file;
2. skips an existing object when size + stored SHA-256 match;
3. verifies uploaded object metadata and size;
4. never deletes unrelated objects;
5. computes current bucket usage before upload;
6. refuses a sync whose projected total exceeds the configured safety ceiling.

Default safety ceiling is **9 GiB**, leaving headroom below the current 10 GB monthly free-storage allowance. Raising that ceiling is a deliberate cost-impacting decision and must not happen automatically.

Example:

```bash
python scripts/r2_sync.py ./staging/audio/mn --prefix audio/mn --dry-run
python scripts/r2_sync.py ./staging/audio/mn --prefix audio/mn
```

## Delivery policy

R2 is a media/preservation origin, not the canonical metadata database. GitHub keeps source metadata, provenance, manifests, restore instructions, and checksums. Internet Archive / other preservation mirrors may later receive the same verified artifacts.

Do not enable broad public bucket access merely to make URLs easy. Prefer a reviewed Cloudflare Worker/R2 binding or controlled custom-domain strategy so cache, CORS, headers, fallback, and future mirror routing remain under application control.
