import {readFileSync,writeFileSync} from 'node:fs';

const preview=process.env.PREVIEW_URL;
if(!preview)throw new Error('Verified preview URL is required');
const verifiedAt=new Date().toISOString();
const statusPath='data/status/hosting-status.json';
const status=JSON.parse(readFileSync(statusPath,'utf8'));
status.lastVerifiedAt=verifiedAt;
status.hosting={currentPrimary:'vercel',plannedPrimary:'cloudflare-workers',secondary:'vercel',phase:'preview-verified-production-pending',cloudflarePreview:preview,cloudflareDeployment:null,cloudflareBuild:'pass',cloudflareSmoke:'pass',vercelStatus:'backup-rate-limited-no-retry',cutoverAllowed:false};
writeFileSync(statusPath,JSON.stringify(status,null,2)+'\n');
const currentPath='docs/CURRENT_STATE.md';
let current=readFileSync(currentPath,'utf8');
current=current.replace(/- Hosting:[\s\S]*?(?=\n- Locales:)/,`- Hosting: Cloudflare preview verified at ${preview}; production cutover remains blocked until an explicit production gate. Vercel remains current primary/backup candidate and is not retried while rate-limited.`);
current=current.replace(/- Blocker:[\s\S]*$/,'- Blocker: Cloudflare production has not been deployed; preview verification is complete.');
writeFileSync(currentPath,current.trimEnd()+'\n');
