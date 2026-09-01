# AGENTS.md

## Mandatory startup
Before making any change, read `PROJECT_STATE.md`, `README.md`, and `data/README.md`.

## Product rules
- The Vietnamese product name is `5 Đại Tạng Kinh Nikāya`.
- Vietnamese UI uses TrB/TB/TƯB/TCB/TiB as primary codes; DN/MN/SN/AN/KN are secondary references only.
- Do not show technical/product-development notes to end users.
- Do not send readers away from the library for primary reading. Full text belongs in the reader whenever redistribution/serving is permitted.
- Never substitute a different language for content/audio/PDF without clearly asking the user.
- **Primary listening architecture: pre-generated MP3.** Generate each discourse once in CI/backend, store it on stable object/release storage, then every browser/device streams the same file. Never run neural/Piper/ONNX TTS in an end user's browser as the primary path.
- Device/Web Speech TTS is optional secondary convenience only. Render it only when the browser exposes a matching voice for the selected language; otherwise hide it completely instead of showing an error state.
- PDFs presented as the library's PDF must be generated from the library's current content, not linked from third-party PDF files.
- YouTube is contextual supplementary media, not a homepage feed.

## Data rules
- `data/catalog/*.json` is canonical metadata.
- Preserve stable IDs and content hashes.
- Provenance/license metadata travels with content, audio manifests, and RAG chunks.
- Do not hard-code large scripture corpora inside React components.
- Prefer stable segment IDs and semantic sections over arbitrary character chunks.

## UX rules
Test phone, tablet/DeX, desktop, and >=1500px wide. Reader must expose obvious home/library navigation, global search, previous/next, quick jump, font controls, dark mode, progress save/resume, pre-generated MP3 playback, generated PDF, and optional device TTS only when supported. MP3 player must support seek, pause/resume, and playback speed.

## Quality gate
Do not call work complete until GitHub Actions passes RAG export validation, Next build, route smoke tests, and audio asset verification for the collection being released. Update `PROJECT_STATE.md` whenever architecture or project priorities materially change.
