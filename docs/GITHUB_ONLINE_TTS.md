# Hybrid narration policy: best voice first

This policy applies to the Theravāda library and reusable scripture-library projects.

## User-facing priority

The website must always prefer the best verified narration available, while preserving resilient fallbacks:

1. **Preferred:** Gemini 3.1 Flash TTS generated online by GitHub Actions and stored at `audio/gemini/<collection>/<canonicalRef>.mp3`.
2. **Backup MP3:** trusted PC/local narration already published at `audio/<collection>/<canonicalRef>.mp3`, plus any existing verified catalog MP3.
3. **Optional fallback:** browser speech synthesis from the exact source-backed text already displayed on the scripture page.

A higher-quality cloud asset must never overwrite or delete a valid local MP3. The two production lanes are independent and can improve coverage in parallel.

## GitHub online lane

`materialized source-backed corpus in GitHub -> GitHub Actions -> Gemini 3.1 Flash TTS -> technical validation -> Cloudflare R2 preferred prefix -> remote verification -> Archive.org mirror -> website discovers audio`

The GitHub lane does not depend on the Windows PC. The Windows/PC TTS lane continues independently and publishes backup audio.

## Free-tier behaviour

- Use `gemini-3.1-flash-tts-preview` when the repository key has access.
- Do not hard-code guessed RPM/RPD values. Quotas are model/project/tier specific and can change.
- Render one missing **preferred Gemini** scripture per workflow run.
- Schedule hourly. If Gemini returns quota/rate-limit (`429`/`RESOURCE_EXHAUSTED`), exit cleanly and retry on the next scheduled run.
- Existing PC MP3 and browser reading continue to serve users while Gemini is quota-limited.
- Never create multiple keys to evade project quota.

## Source integrity

- Input comes only from materialized, source-backed scripture under `data/content`.
- Never ask an LLM to rewrite, summarize, translate, expand, or invent scripture before TTS.
- Technical/navigation markers may be removed, but canonical wording remains immutable.
- Store exact text SHA-256 and output audio SHA-256 in the receipt.

## Audio policy

- Deterministically rotate suitable Gemini voices by canonical reference.
- Prompt for calm, clear, reverent Vietnamese narration and verbatim reading.
- Encode final public assets to 48 kHz mono 96 kbps MP3.
- Reject empty or suspiciously short outputs.
- Keep local/VieNeu audio untouched as backup even after Gemini becomes available.

## Website selection

For each Vietnamese scripture page the client probes sources in priority order:

`Gemini preferred -> local/legacy/catalog MP3 -> browser reader`

Only an available MP3 is selected. Browser reading remains an optional control whenever text is available, even when a better MP3 exists.

## Storage and publishing

- Preferred Gemini: `audio/gemini/<collection>/<canonicalRef>.mp3`.
- Local/PC backup: `audio/<collection>/<canonicalRef>.mp3`.
- Existing catalog MP3 remains a valid lower-priority fallback.
- Verify byte size and SHA-256 metadata after cloud upload.
- Keep only small receipts in GitHub Actions artifacts; never commit large MP3 files to Git history.
- Trigger Archive.org mirror after verified R2 publication.

## Required repository secrets

- `GEMINI_API_KEY` or `GOOGLE_API_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- Archive.org credentials remain managed by the mirror workflow.

Never print secret values in logs.

## Privacy

Free-tier Gemini processing is used only for public scripture text. Never send private voice samples, personal documents, unpublished material, credentials, or private user data through this lane.

## Long-term rule

For future projects, do not treat one TTS engine as the only source. Maintain a quality-ranked, independently generated audio stack so users get the best available voice without losing coverage when a cloud service is unavailable or quota-limited.
