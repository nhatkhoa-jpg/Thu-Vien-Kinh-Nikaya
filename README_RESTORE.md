# Restore the library

The repository is the restore root for application source, canonical metadata,
materialized text, manifests, checksums, workflows, and deployment instructions.

## Rebuild without a personal account

1. Clone the public repository and check out a verified tag or commit.
2. Install Node.js 22 and Python 3.12.
3. Run corpus validation and regenerate derived exports:

   ```bash
   python scripts/update_corpus_status.py
   python scripts/validate_corpus.py
   npm ci
   npm run rag:export
   npm run build
   ```

4. For Cloudflare, create a free Workers account, set only the scoped secrets
   documented in `README_DEPLOY.md`, run `npm run build:vinext`, and deploy the
   generated Worker.
5. If Cloudflare is unavailable, the standard Next.js build can run on any
   compatible Node host. A future pure-static reader may also consume the
   versioned catalog/content JSON directly.

## Restore data

- `data/catalog/` contains canonical metadata and source snapshots.
- `data/content/` contains source-backed local full text.
- `data/status/corpus-status.json` distinguishes catalog from verified full text.
- `data/exports/` is derived and can be regenerated.
- GitHub releases currently hold checkpoint/preservation audio; manifests and
  checksums must be retained even after Internet Archive or Hugging Face mirrors
  are added.

Never invent missing translations during recovery. Re-run authoritative
discovery, compare source hashes, resume materialization from verified records,
and preserve canonical range UIDs exactly.

