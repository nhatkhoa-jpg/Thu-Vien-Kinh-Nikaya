# AGENTS.md

## Mandatory startup
Before making any change, read `PROJECT_STATE.md`, `README.md`, and `data/README.md`.

## Product rules
- The Vietnamese product name is `5 Đại Tạng Kinh Nikāya`.
- Vietnamese UI uses TrB/TB/TƯB/TCB/TiB as primary codes; DN/MN/SN/AN/KN are secondary references only.
- Do not show technical/product-development notes to end users.
- Do not send readers away from the library for primary reading. Full text belongs in the reader whenever redistribution/serving is permitted.
- Never substitute a different language for content/audio/PDF without clearly asking the user.
- **Corpus first:** canonical catalog + full text + generated PDF + reader/search/navigation must progress independently of audio. A missing MP3 must never block publication of a valid readable discourse.
- **Prebuilt MP3 is the primary listening path when available.** Generate each scripture audio once, publish it to stable storage/CDN, and stream that same asset to every OS/browser.
- Existing Piper MP3 files are technical checkpoints, not automatically final-quality audio. Prefer cloud-quality TTS within legitimate free tiers for final audio; version and replace progressively without re-rendering valid final assets.
- Audio rendering is asynchronous and may span days/months. Normalize narration text first (punctuation, pauses, numbers/codes, Buddhist terms, Pāli), then synthesize, validate duration/hash/provider/voice/version, checkpoint, publish, and update mapping.
- Device Web Speech is optional secondary playback only. Show it only when the current device exposes a matching language voice; otherwise hide it completely.
- Do not reintroduce browser neural/WASM TTS or server runtime TTS as the main listening architecture.
- PDFs presented as the library's PDF must be generated from the library's current content, not linked from third-party PDF files.
- YouTube is contextual supplementary media, not a homepage feed.

## Data rules
- `data/catalog/*.json` is canonical metadata.
- Preserve stable IDs and content hashes.
- Provenance/license metadata travels with content and RAG chunks.
- Do not hard-code large scripture corpora inside React components.
- Prefer stable segment IDs and semantic sections over arbitrary character chunks.
- Do not guess canonical counts for SN/AN/KN; discover from a standard source and validate before materializing.
- For Trung Bộ Vietnamese audio, the verified checkpoint release tag is `mn-vi-audio-v1` and the exact asset set is `mn1.mp3` through `mn152.mp3`; this does not imply those files are final-quality narration.
- For Trường Bộ, `dn-vi-audio-v1` contains DN1–DN34 checkpoint MP3, but collection completeness is determined by corpus/catalog/reader/PDF coverage, not MP3 count alone.

## UX rules
Test phone, tablet/DeX, desktop, and >=1500px wide. Reader must expose obvious home/library navigation, global search, previous/next, quick jump, font controls, dark mode, progress save/resume, generated PDF, and MP3 playback when an asset exists. A discourse without MP3 must still read/PDF normally and must not show a broken or fake audio control. MP3 player must retain speed controls, ±15-second seek, and resume position.

## Quality gate
Do not call a collection corpus complete until 100% canonical catalog/full-text coverage, generated PDF/reader smoke tests, RAG export validation, Next build, responsive checks, main merge, and stable Vercel production all pass. Audio completeness is a separate gate: only call audio complete when 100% final-quality MP3 mappings pass validation. Update `PROJECT_STATE.md` whenever architecture or project priorities materially change.
