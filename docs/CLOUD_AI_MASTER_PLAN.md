# Cloud AI Master Plan & Repository Status

*Maintained autonomously by Troc Cloud AI Worker.*
*Date: September 4, 2026*
*Repository:* `nhatkhoa-jpg/Thu-Vien-Kinh-Nikaya`
*Base Branch:* `main`

---

## 1. Executive Summary & Handoff Priorities
- **Audio Priority Handoff:** On Vietnamese reader pages, audio priority follows:
  1. Catalogued Google Cloud Text-to-Speech high-quality narration (when available).
  2. Browser/device speech synthesis fallback.
  3. Legacy/local MP3 fallback.
- **Corpus Integrity:** MN collection remains complete at 152/152. Other Nikaya collections (DN, SN, AN, KN) maintain trustworthy source-backed provenance, canonical references, and hashes. No fabrication of canonical text.
- **Locales & UX:** Maintained 8 public locales (`vi`, `en`, `th`, `my`, `si`, `km`, `lo`, `zh`). Clear fallback notices when non-English languages lack native translation.
- **Ads & SEO:** AdSense-ready layout, sitemap, robots, privacy-safe analytics.

---

## 2. Roadmap Checklist & Metrics

- [x] Maintain green build, typecheck, and test contracts (`npm run build`, smoke tests).
- [x] Preserve source-backed scripture coverage (MN 152/152 verified).
- [x] Audio priority ordering (Cloud TTS / catalog narration -> browser speech -> local MP3 fallback).
- [x] Localized book art labels (`LocalizedBookArt`).
- [x] Stale smoke test assertion updates (aligning playwight smoke expectations with current Cloud TTS / audio provider contracts rather than obsolete Gemini-first probing).
- [ ] Continuous corpus expansion and validation across DN, SN, AN, KN.

---

## 3. Verification & Validation Protocol
- Run `npm run build` or `npx next build` to verify type safety and compilation.
- Run smoke tests against local or preview deployments to ensure UI, search, localization, and audio selectors operate correctly.
