# AGENTS.md

## Mandatory startup
Before making any change, read `PROJECT_STATE.md`, `README.md`, and `data/README.md`.

## Product rules
- The Vietnamese product name is `5 Đại Tạng Kinh Nikāya`.
- Vietnamese UI uses TrB/TB/TƯB/TCB/TiB as primary codes; DN/MN/SN/AN/KN are secondary references only.
- Do not show technical/product-development notes to end users.
- Do not send readers away from the library for primary reading. Full text belongs in the reader whenever redistribution/serving is permitted.
- Never substitute a different language for content/audio/PDF without clearly asking the user.
- **Prebuilt MP3 is the primary listening path.** Generate each scripture audio once, publish it to stable storage/CDN, and stream that same asset to every OS/browser.
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
- For Trung Bộ Vietnamese audio, the verified release tag is `mn-vi-audio-v1` and the exact asset set is `mn1.mp3` through `mn152.mp3`.

## UX rules
Test phone, tablet/DeX, desktop, and >=1500px wide. Reader must expose obvious home/library navigation, global search, previous/next, quick jump, font controls, dark mode, progress save/resume, primary MP3 playback, generated PDF, and device speech only when supported. MP3 player must retain speed controls, ±15-second seek, and resume position.

## Quality gate
Do not call work complete until GitHub Actions passes RAG export validation, Next build, MP3 catalog validation, and reader smoke tests. Update `PROJECT_STATE.md` whenever architecture or project priorities materially change.
