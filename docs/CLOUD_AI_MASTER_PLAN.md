# Cloud AI Master Plan & Project Status

*Last updated: September 4, 2026*
*Active branch: work/cloud-ai-nikaya-auto-33925481338*
*Project: Thu-Vien-Kinh-Nikaya (v2.0.0-mn-stage)*

## 1. Project Overview & Core Mandates
- **Corpus Coverage:** DN (34/34), MN (152/152), SN, AN, KN.
- **Audio Priority Handoff:** On Vietnamese reader pages, audio priority follows:
  1. Catalogued Google Cloud Text-to-Speech high-quality narration when available.
  2. Browser/device speech synthesis.
  3. Legacy/local MP3 fallback.
- **Localization:** 8 public locales (`vi`, `en`, `th`, `my`, `si`, `km`, `lo`, `zh`). Explicit fallback notices when non-English translations are missing.
- **Privacy & Stats:** Privacy-safe anonymous stats tracker via Cloudflare / edge analytics.

## 2. Completed Milestones & Verification
- [x] MN corpus 152/152 complete with verified SuttaCentral provenance and canonical references.
- [x] DN corpus 34/34 complete.
- [x] 8 public locales verified in smoke tests.
- [x] Audio priority ordering (Cloud TTS / catalog narration -> browser speech -> local MP3 fallback).
- [x] Stale smoke test assertion updates (aligning Playwright smoke expectations with current Cloud TTS / audio provider contracts rather than obsolete Gemini-first probing).
- [x] Localized book artwork and clean mobile/desktop UX.

## 3. Current Priorities & Next Steps
- [ ] Maintain green build, typecheck, and validation suites across all collections.
- [ ] Continue source-backed Vietnamese coverage, provenance, and canonical refs for SN, AN, KN collections.
- [ ] Ensure RAG exports, search indexes, and canonical metadata remain in sync with materialized content shards.
- [ ] Preserve privacy-safe Stats, SEO/sitemap/robots, accessibility, performance, and AdSense-ready layout.

## 4. Corpus Statistics Summary
- Materialized content shards: 69
- Materialized catalog entries: 3,386
- Supported locales: 8
