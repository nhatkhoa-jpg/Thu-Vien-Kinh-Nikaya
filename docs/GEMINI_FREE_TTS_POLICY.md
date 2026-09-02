# Gemini Free TTS Strategy

This file records the long-term TTS policy for the Theravāda library and future scripture-library projects.

## Goal

Use free cloud TTS opportunistically to improve Vietnamese narration quality and throughput without making the library dependent on one vendor or on paid quota.

## Preferred engine order

1. `gemini-3.1-flash-tts-preview` when the project's current Free Tier quota is available and quality checks pass.
2. `gemini-2.5-flash-preview-tts` as a secondary Gemini TTS lane when useful and within its own active limits.
3. Local VieNeu built-in voices as the always-available zero-cloud-cost fallback.

Never stop production merely because Gemini quota is exhausted.

## Quota policy

- Do not hard-code claims such as 1,500 requests/day for TTS. Gemini API limits are model- and project-specific, preview models can be more restrictive, and Google states actual capacity may vary.
- Active limits must be read from Google AI Studio for the project being used, or inferred conservatively from API responses.
- Quotas are per project, not per API key. Do not rotate keys/accounts to evade limits.
- Maintain local counters and a conservative token-bucket/RPM limiter.
- On HTTP 429 / RESOURCE_EXHAUSTED: exponential backoff with jitter, stop claiming new Gemini chunks after repeated quota errors, and immediately hand work to local VieNeu.
- Daily reset handling must follow Google's documented quota reset semantics rather than local midnight assumptions.

## Quality policy

- Scripture text is immutable. Never summarize, paraphrase, expand, translate, or invent wording for TTS.
- Prompt Gemini to read exactly the supplied source text, with calm Theravāda audiobook delivery and no added introductions or conclusions.
- Preserve Pāli terms and punctuation from the validated corpus.
- Remove only known technical/export markers before inference; normalization must not change canonical chunk mapping.
- Long articles must be split into small semantic chunks. Google notes quality/voice consistency can drift on outputs longer than a few minutes. Prefer roughly 60-180 seconds of expected speech per request, with sentence/paragraph boundaries.
- Keep deterministic chunk IDs and checkpoints so successful chunks are never regenerated unnecessarily.
- Validate every returned audio chunk for non-empty audio, plausible duration, decodability, sample format, and boundary continuity before concatenation.
- Optional local STT round-trip may be used only as a gross omission/repetition detector; it must never rewrite the canonical text.
- Final output remains 48 kHz mono 96 kbps MP3 unless the production media specification changes globally.

## Voice policy

- Benchmark several Gemini voices on the same short Vietnamese Buddhist passage before enabling a new model version.
- Prefer a calm, mature, neutral Vietnamese reading style, moderate pace, clear Pāli pronunciation, low theatricality, and stable volume.
- Do not clone private voices through Gemini for this library.
- Model/voice changes require a short A/B quality test before becoming default.

## Scheduler architecture

Production must be engine-agnostic:

`validated corpus -> chunk queue -> engine router -> chunk QC -> concatenate -> final QC -> publish`

Engine router rules:

- If Gemini Free Tier is healthy and quota budget remains: dispatch a bounded number of chunks concurrently to Gemini.
- If Gemini is rate-limited, unavailable, returns repeated server errors, or reaches the configured daily safety budget: route pending chunks to local VieNeu.
- Do not let both engines synthesize the same claimed chunk concurrently.
- Preserve per-chunk engine/model/voice metadata for audit and future re-render decisions.

## Cost and privacy

- Free Tier is preferred only while it is genuinely free for the selected TTS model.
- Before every major rollout, re-check Google's current pricing and rate-limit documentation because preview terms can change.
- Google currently states Free Tier content may be used to improve its products. Therefore only public/non-sensitive scripture text should be sent through the free cloud lane. Private recordings, credentials, unpublished personal material, or sensitive data must not be sent under this policy.

## Operational rule for Codex PC

Codex must not sit and watch TTS production. Codex may inspect, implement, test briefly, start/update the local supervisor or scheduled task, print one status snapshot, then exit. Long-running quota tracking, retries, failover, rendering, upload and cleanup belong to local scripts/supervisors. Codex is called again only on a genuine stall or fault.

## Future projects

Treat this as the default TTS architecture for future scripture/audio-library projects unless a project explicitly overrides it: free cloud accelerator first when safe and useful, local TTS fallback always available, quota-aware automation, immutable source text, checkpointed chunks, and no manual babysitting.
