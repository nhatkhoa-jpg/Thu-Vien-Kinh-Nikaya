# 5 Đại Tạng Kinh Nikāya

Modern multilingual Next.js library for the Five Nikāya collections. Built for long-form reading, audio/PDF downloads, source-aware content rights, and optional YouTube embeds on individual discourse pages.

## UX v2
- Product-style library dashboard instead of a long marketing landing page.
- Responsive breakpoints for phone, tablet/DeX, desktop, and wide displays.
- Mobile bottom navigation; desktop/tablet navigation and wider content grids.
- Reader controls for font size, dark mode, save position, and resume.
- Audio speed controls from 0.75× to 2× plus ±15-second seek.
- YouTube is hidden unless a discourse actually has a mapped video.
- Test library expanded across DN / MN / SN / AN / KN.

## Languages
16 UI locales: Vietnamese, English, Chinese, Hindi, Spanish, Arabic, French, Bengali, Portuguese, Russian, Indonesian, Urdu, German, Japanese, Korean, and Thai.

## Content rights
Do not redistribute a translation, PDF, or audio file unless its licence or permission explicitly allows it. Source and rights metadata are kept per discourse.

## Production
Primary verified fallback deployment from v1: https://thu-vien-nikaya-now-khoa-3f1b.vercel.app

Current Next.js source is `main`; CI validates every push before deployment.
