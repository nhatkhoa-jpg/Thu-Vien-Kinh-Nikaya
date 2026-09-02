# Work lanes

This repository uses separate Git branches so ChatGPT chat-side operations and ChatGPT Work/Codex development can run in parallel without overwriting each other.

## 1. Main

`main` is integration/production only. Do not develop directly on `main`. Merge only tested branches or bot-produced milestone commits.

## 2. Chat-side operations lane

Branch prefix: `ops/chatgpt-*`

Primary scope:
- Cloudflare/Vercel hosting and deployment
- GitHub Actions / CI/CD
- smoke tests, status checks, recovery tooling
- operational scripts and documentation
- safe maintenance that does not rewrite scripture corpus data

Chat-side work should avoid editing corpus/content/UI implementation files while a Work/Codex task is active unless the task is explicitly handed over.

## 3. Work/Codex development lane

Preferred branch prefix: `work/*` (existing `feature/*` branches may continue until finished).

Primary scope:
- corpus ingestion/materialization
- scripture metadata and translations
- application UI/components
- audio generation pipelines and media production
- larger refactors and feature work

Work/Codex should not change Cloudflare production workflows, deployment credentials, hosting status, or operational release scripts unless the task explicitly says to take over that lane.

## 4. Handoff rule

Before crossing lanes, first merge or close the current branch and start a new branch from the latest `main`. Never have two agents edit the same branch concurrently.

## 5. Production rule

Cloudflare production deploys are manual/gated and run from a tested `main` commit. Preview must pass build, bundle dry-run, real deployment, and smoke tests before production promotion. Vercel remains an independent fallback and should not be modified by corpus jobs.

## 6. Background automation

Long-running or repetitive work should run in GitHub Actions rather than depend on an interactive chat session. Scheduled/resumable jobs may continue even when ChatGPT Work credit is unavailable. Interactive agents should only prepare, inspect, approve, repair, or promote those jobs.
