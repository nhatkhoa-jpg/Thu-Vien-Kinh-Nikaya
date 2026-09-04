# Trọc Cloud Codex

Cloud coding agent for this repository. It runs on a GitHub-hosted Ubuntu VM, uses `GEMINI_API_KEY`, edits/tests the checked-out repository, then opens a pull request with its changes.

## Fastest way from a phone

Create a new GitHub Issue owned by the repository owner. The issue title **must start with**:

```text
[AI JOB]
```

Put the complete task in the issue title/body. Example:

```text
[AI JOB] Rà soát trang chủ mobile

Kiểm tra giao diện mobile, sửa lỗi overflow và các nút khó bấm. Chạy build/test. Không đụng workflow Cloudflare production.
```

Only issues created by the repository owner can trigger the agent. Other users' issues do not start the workflow.

## Alternative: Actions UI

Open **Actions → Trọc Cloud Codex → Run workflow**, enter the task, and run it.

## What happens

1. GitHub starts a fresh cloud VM.
2. Gemini CLI reads the repository and task.
3. The agent may edit files and run normal project build/test/lint commands.
4. The agent is not given a GitHub token while it reasons/executes code.
5. A separate trusted workflow step creates a branch and pull request from the resulting working-tree changes.
6. The VM is destroyed when the job ends.

A single GitHub-hosted job is capped below GitHub's 6-hour hosted-runner limit. The workflow itself uses a 330-minute job timeout and a 5-hour agent execution timeout so there is time left to upload logs and create the PR.

## Required secret

Repository Actions secret:

```text
GEMINI_API_KEY
```

Default model:

```text
gemini-3.7-flash
```

## Safety boundaries

- Owner-only issue trigger.
- Agent is instructed to stay inside the repository and `/tmp`.
- The Gemini process does not receive `GITHUB_TOKEN`.
- Production hosting/deployment workflows and credentials are out of scope unless a task explicitly requests them.
- Agent never merges automatically. Review the generated PR and CI before merging.

## Logs

Every run uploads a `cloud-codex-log-<run-id>` artifact for 7 days. Issue-triggered jobs also post the run link and final PR link back into the issue.
