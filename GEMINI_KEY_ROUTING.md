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

- `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya` -> primary `GEMINI_API_KEY_NIKAYA`.
- `nhatkhoa-jpg/TROC-TTS-Gemini-Cloud` -> primary `GEMINI_API_KEY_CLOUD`.
- `nhatkhoa-jpg/TR-C-Gemini-TTS-Music-Gen-` -> primary `GEMINI_API_KEY_DEV` while this remains experimental/development workload. Reassign explicitly when promoted to production.
- `nhatkhoa-jpg/TrocAutoStudio` -> **never embed a Gemini key in the Android APK**. Local/mobile code must call a trusted backend/proxy. Backend/CI experiments may use `GEMINI_API_KEY_DEV`; YouTube-specific backend work may use `GEMINI_API_KEY_YOUTUBE` server-side only.
- `nhatkhoa-jpg/TrocAutoStudio-Releases` -> release-artifact repository; no Gemini runtime use.
- YouTube Command Center / YouTube automation backends -> `GEMINI_API_KEY_YOUTUBE`.
- Facebook / Social Command Center backends -> `GEMINI_API_KEY_FACEBOOK`.

## Mandatory runtime rules

1. Use only the assigned role secret for the workload. Do not pick a different key merely because it exists in the repository.
2. Never round-robin project keys to bypass Gemini quotas or provider rate limits.
3. `RESERVE_01` and `RESERVE_02` are **manual reserve capacity** for a new project, credential incident, or deliberate workload reassignment. A 429/quota response alone is not permission to auto-switch to reserve.
4. Handle 429 with Retry-After/exponential backoff and preserve job state.
5. Never auto-failover from Free Tier to Paid Tier.
6. Do not expose any Gemini credential to browser JavaScript, static HTML, React client bundles, Android resources, `BuildConfig`, APK assets, logs, telemetry, or user-visible error messages.
7. GitHub Actions secrets exist only inside authorized workflow jobs. They do **not** automatically become Vercel/Oracle/Cloudflare runtime environment variables. Each deployed backend must receive its assigned secret through that platform's own secret/environment system.
8. Prefer a backend/gateway for mobile/web clients. The backend reads the secret; the client receives only application data.
9. When adding a new project, record its routing here before using Gemini.

## GitHub Actions mapping pattern

For a server-side/CI job only, map the role-specific secret to the generic runtime name expected by the code:

```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY_NIKAYA }}
```

Use the correct role secret for that repository/workload. Never commit a literal key.

## Handoff rule

Any ChatGPT/Codex/Gemini agent taking over a Trọc project must read this file plus the repository `AGENTS.md` before changing Gemini/API integrations. If runtime wiring is missing, add it server-side without exposing the key to clients.
