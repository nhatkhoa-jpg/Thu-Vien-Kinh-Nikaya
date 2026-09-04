# Gemini Free-Tier Key Routing — durable owner policy

Status: active from 2026-09-05. This file is the durable routing source of truth for all current and future Trọc projects. Never place actual key values in Git, logs, issues, APKs, browser bundles, or screenshots.

## Google AI Studio project pool

| Role | Google project | GitHub Actions secret |
|---|---|---|
| DEV / TEST | `gen-lang-client-0291732397` | `GEMINI_API_KEY_DEV` |
| YOUTUBE | `troc-gm-youtube-c9df76d5` | `GEMINI_API_KEY_YOUTUBE` |
| FACEBOOK | `troc-gm-facebook-c9df76d5` | `GEMINI_API_KEY_FACEBOOK` |
| NIKAYA | `troc-gm-nikaya-c9df76d5` | `GEMINI_API_KEY_NIKAYA` |
| CLOUD | `troc-gm-cloud-c9df76d5` | `GEMINI_API_KEY_CLOUD` |
| RESERVE 01 | `troc-gm-reserve1-c9df76d5` | `GEMINI_API_KEY_RESERVE_01` |
| RESERVE 02 | `troc-gm-reserve2-c9df76d5` | `GEMINI_API_KEY_RESERVE_02` |

All seven projects are intended to remain Free Tier unless the owner explicitly changes that policy.

## Current repository routing

- `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya` -> primary `GEMINI_API_KEY_NIKAYA` for Gemini Developer API work. Google Cloud Text-to-Speech remains a separate product/credential and must not be replaced by the Gemini key.
- `nhatkhoa-jpg/TROC-TTS-Gemini-Cloud` -> primary `GEMINI_API_KEY_CLOUD`.
- `nhatkhoa-jpg/TR-C-Gemini-TTS-Music-Gen-` -> primary `GEMINI_API_KEY_DEV` while experimental/development workload.
- `nhatkhoa-jpg/TrocAutoStudio` -> never embed a centrally managed Gemini key in the Android APK. Centrally managed Gemini access must go through a trusted backend/proxy.
- `nhatkhoa-jpg/TrocAutoStudio-Releases` -> release artifacts plus Oracle A1/GCP infrastructure control. Release artifacts use no Gemini key; server-side infrastructure Gemini work uses `GEMINI_API_KEY_CLOUD`.
- YouTube Command Center / YouTube automation backends -> `GEMINI_API_KEY_YOUTUBE`.
- Facebook / Social Command Center backends -> `GEMINI_API_KEY_FACEBOOK`.

## Nikaya migration state

- `scripts/gemini_github_tts.py` prefers `GEMINI_API_KEY_NIKAYA` and keeps generic names only as legacy compatibility fallbacks.
- Main reader/audio workflows currently using Piper or Google Cloud Text-to-Speech are intentionally not changed to Gemini credentials.
- The shared cloud coding/autopilot worker lives in `TROC-TTS-Gemini-Cloud`, so its credential is CLOUD even when its target repository is Nikaya.

## Mandatory runtime rules

1. Use only the assigned role secret for the workload.
2. Never round-robin project keys to bypass Gemini quotas or provider rate limits.
3. `RESERVE_01` and `RESERVE_02` are manual reserve capacity for new projects, credential incidents, or deliberate workload reassignment. A 429 alone is not permission to auto-switch.
4. Handle 429 with Retry-After/exponential backoff and preserve job state.
5. Never auto-failover Free Tier traffic to Paid Tier.
6. Do not expose centrally managed Gemini credentials to browser JavaScript, static HTML, React client bundles, Android resources, `BuildConfig`, APK assets, logs, telemetry, or user-visible errors.
7. GitHub Actions secrets do not automatically become Vercel/Oracle/Cloudflare runtime variables. Each trusted backend must receive its assigned secret through that platform/deployment path.
8. When adding a new project, record its routing here before using Gemini.

## GitHub Actions mapping pattern

For server-side/CI Gemini work in this repository:

```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY_NIKAYA }}
```

Never commit a literal key.

## Handoff rule

Any ChatGPT/Codex/Gemini agent taking over a Trọc project must read this file plus the repository `AGENTS.md` before changing Gemini/API integrations.
