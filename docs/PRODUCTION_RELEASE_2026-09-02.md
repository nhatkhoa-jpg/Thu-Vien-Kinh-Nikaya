# Production release — 2026-09-02

This release promotes the professional multilingual library upgrade to Cloudflare production.

Included:
- multilingual interface expansion with transparent English scripture fallback where a requested translation is unavailable;
- global responsive footer and trust/navigation links;
- About, Privacy, Terms of Use, and Sources & Editorial Policy pages;
- sitemap coverage for trust pages;
- AdSense-readiness guidance without placeholder publisher IDs or intrusive ad placement;
- correction/reporting path through GitHub Issues;
- credential-gated Internet Archive preservation mirror workflow for verified R2 DN MP3 files.

The Internet Archive mirror remains inactive until `IA_ACCESS_KEY` and `IA_SECRET_KEY` are configured as GitHub Actions secrets. No credentials are stored in the repository.
