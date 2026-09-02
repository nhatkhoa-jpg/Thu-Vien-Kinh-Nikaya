# GitHub-only automatic TTS

This is the preferred cloud TTS architecture for the Theravāda library and reusable scripture-library projects.

## Hard rule

The online TTS lane must be independent from the Windows production PC. It must not wait for, poll, call, or fall back to VieNeu/local workers. Local TTS is a separate lane.

## Flow

`materialized source-backed corpus in GitHub -> GitHub Actions -> Gemini 3.1 Flash TTS -> technical validation -> Cloudflare R2 -> remote verification -> Archive.org mirror -> website discovers audio`

## Free-tier behaviour

- Use `gemini-3.1-flash-tts-preview` when the repository has a Gemini Developer API key with Free Tier access.
- Do not hard-code guessed RPM/RPD values. Quotas are model/project/tier specific and can change.
- Render only one missing scripture per workflow run.
- Schedule hourly. If Gemini returns quota/rate-limit (`429`/`RESOURCE_EXHAUSTED`), exit cleanly and retry on the next scheduled run instead of spinning or polling.
- Never create many API keys to bypass project quota.

## Source integrity

- TTS input must come only from materialized, source-backed scripture under `data/content`.
- Never ask an LLM to rewrite, summarize, translate, expand, or invent scripture before TTS.
- Technical/navigation markers may be removed, but canonical scripture wording must remain immutable.
- Store the exact text SHA-256 and output audio SHA-256 in the receipt.

## Audio policy

- Deterministically rotate suitable prebuilt Gemini voices by canonical reference so the library does not sound monotonous.
- Prompt for calm, clear, reverent Vietnamese narration and verbatim reading.
- Gemini returns 24 kHz mono PCM; encode the final public asset to 48 kHz mono 96 kbps MP3.
- Reject empty or suspiciously short outputs.

## Storage and publishing

- GitHub runner uploads the verified final MP3 directly to private R2 at `audio/<collection>/<canonicalRef>.mp3` using repository secrets.
- Verify byte size and SHA-256 metadata after upload.
- Keep only a small JSON receipt as a GitHub Actions artifact; do not store large MP3 files in Git history.
- Trigger the existing Archive.org mirror after R2 verification.
- Public scripture pages probe the corresponding R2 object and show Listen/Download only when it exists.

## Required repository secrets

- `GEMINI_API_KEY` (preferred) or `GOOGLE_API_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- Archive.org secrets remain managed by the existing mirror workflow.

Never print secret values in logs.

## Privacy

Free Tier Gemini data may be used by Google to improve products. This lane therefore sends only public scripture text. Never send private voice samples, personal documents, unpublished material, credentials, or private user data through this free TTS lane.

## Separation from the PC lane

The Windows/VieNeu system may continue producing audio independently, but it is not a fallback or dependency of this workflow. R2 object existence is the shared publication boundary: whichever trusted pipeline publishes a verified object first wins, and the other lane should skip that object rather than overwrite it automatically.
