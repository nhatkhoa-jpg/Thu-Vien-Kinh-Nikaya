# AGENTS.md

## Mandatory startup
Before making any change, read `PROJECT_STATE.md`, `README.md`, and `data/README.md`.

## Product rules
- The Vietnamese product name is `5 Đại Tạng Kinh Nikāya`.
- Vietnamese UI uses TrB/TB/TƯB/TCB/TiB as primary codes; DN/MN/SN/AN/KN are secondary references only.
- Do not show technical/product-development notes to end users.
- Do not send readers away from the library for primary reading. Full text belongs in the reader whenever redistribution/serving is permitted.
- Never substitute a different language for content/audio/PDF without clearly asking the user.
- Browser/device TTS is the primary resilient listening path. External MP3 is optional secondary media.
- PDFs presented as the library's PDF must be generated from the library's current content, not linked from third-party PDF files.
- YouTube is contextual supplementary media, not a homepage feed.

## Data rules
- `data/catalog/*.json` is canonical metadata.
- Preserve stable IDs and content hashes.
- Provenance/license metadata travels with content and RAG chunks.
- Do not hard-code large scripture corpora inside React components.
- Prefer stable segment IDs and semantic sections over arbitrary character chunks.

## UX rules
Test phone, tablet/DeX, desktop, and >=1500px wide. Reader must expose obvious home/library navigation, global search, previous/next, quick jump, font controls, dark mode, progress save/resume, browser TTS, generated PDF, and optional matched-language MP3.

## Quality gate
Do not call work complete until GitHub Actions passes RAG export validation, Next build, and smoke tests. Update `PROJECT_STATE.md` whenever architecture or project priorities materially change.
