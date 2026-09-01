# Thư viện Kinh Nikāya

Multilingual library for the Five Nikāyas, built for long-form reading, audio/PDF downloads, source-aware content rights, and optional YouTube embeds.

## Live production

- Stable production alias: https://thu-vien-nikaya-now-khoa-3f1b.vercel.app
- Vercel deployment status at creation: **READY / production**
- Deployment ID: `dpl_22Sc7fZNAw9CdaGuDSVPLX2nrJF6`

The live fallback is a self-contained static SPA so it remains independent of Next.js build/runtime issues. The Next.js code in `main` remains the canonical development source for SEO-friendly locale routes and future full-canon ingestion.

## Features
- 16 UI languages: Vietnamese, English, Chinese, Hindi, Spanish, Arabic, French, Bengali, Portuguese, Russian, Indonesian, Urdu, German, Japanese, Korean, and Thai.
- Five Nikāya collection navigation: DN, MN, SN, AN, KN.
- Reader-first responsive layout for phone, tablet, Samsung DeX, and desktop.
- Search/filter by title, code, Pāli, collection, and topic.
- PDF/MP3 asset slots with direct access/download.
- In-page audio player with playback-speed control.
- Local reading-position persistence.
- YouTube video mapping per discourse/topic/collection.
- RTL support for Arabic and Urdu.
- Sitemap, robots and locale-aware SEO structure in the Next.js source.
- Data model separates scripture metadata from translation/audio/video rights.

## Content rights
Do not redistribute a translation, PDF, or audio file unless its licence or permission explicitly allows it. `sourceUrl`, `licenseNote`, `pdfUrl`, and `mp3Url` live on each discourse record so rights can be audited individually.

## Build validation
GitHub Actions validates the canonical Next.js source with `npm install` and `npm run build` on pushes to `main`. The recovery commit after removing the broken GitHub Pages fallback is `62ef5edc12087f3ee06372e231e3f28d0f13500f`, and its build completed successfully.
