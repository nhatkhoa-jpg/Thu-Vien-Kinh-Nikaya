# Cloudflare deployment

## Architecture decision

The production target is Cloudflare Workers with Static Assets through vinext.
The standard Next.js build remains available for Vercel as a secondary mirror.

This application is not currently a safe full static export:

- `app/[locale]/library/[slug]` is an ISR Server Component and resolves dynamic
  catalog slugs at request time;
- untranslated/unmaterialized texts currently use a server-side SuttaCentral
  fallback;
- `app/[locale]/tien-do` reads live GitHub workflow/release state and is forced
  dynamic;
- exporting every locale × canonical slug would create tens of thousands of
  pages and rebuild them after ordinary corpus checkpoints.

vinext's compatibility check reports the App Router and all used `next/*`
imports as supported. Its only reported config caveat is App Router Strict Mode,
which Next.js already enables by default. The Cloudflare dry run must remain
below the Workers Free compressed bundle limit.

## Local build and preview

```bash
npm ci
npm run build:vinext
npx wrangler deploy --dry-run --config dist/server/wrangler.json
npm run start:vinext
```

The ordinary Next.js mirror remains testable with:

```bash
npm run build
npm run start
```

## Required secrets

No secret belongs in the repository. GitHub environment
`cloudflare-production` requires:

- `CLOUDFLARE_API_TOKEN`: scoped to deploy this Worker;
- `CLOUDFLARE_ACCOUNT_ID`: the owning Cloudflare account ID.

Do not grant DNS or billing permissions merely to deploy the `workers.dev`
preview. A custom domain is optional.

## Deployment policy

Corpus workflows may checkpoint frequently, but they never invoke the
production workflow. Production deployment is manual through
`Cloudflare Production Deploy` and is intended for collection milestones or a
small number of deliberate releases. Audio files remain in external release or
archive mirrors and are not copied into Worker static assets.

## Preview verification

Before cutover, verify `/vi`, `/en`, real catalog slugs for MN/DN/SN, a missing
Vietnamese record, a range UID, search/filter/load-more, reader source/PDF/audio,
progress, sitemap, robots, 404s, locale routing, and direct deep-link reloads.
Check phone, tablet/DeX, desktop, and wide layouts. Record the tested preview URL
in `data/status/hosting-status.json` only after it exists.

## Cutover and rollback

1. Keep `NEXT_PUBLIC_SITE_URL` pointed at the existing production URL during
   preview so canonical SEO links do not move prematurely.
2. After preview smoke tests pass, merge the migration branch and dispatch one
   production deployment.
3. Verify the Worker URL before changing any custom-domain DNS or canonical URL.
4. Roll back by deploying the last known-good Git commit. DNS changes, if any,
   must be reverted separately. Do not delete the Vercel project; it remains a
   secondary mirror.

