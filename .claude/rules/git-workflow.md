# Git Workflow

This repo pushes directly to master — no PRs, no release process.

## Ship flow

`/ship` runs: `/check` → `/review` → `/commit` → `git push`

Skip all PR-related steps: no branch creation, no `gh pr create`, no CodeRabbit PR review,
no release tagging, no changelog generation.

## Rules

- Commit directly on master — no feature branches unless explicitly asked
- `git push origin master` after committing — no force push, no PR
- `/commit` then `git push` is the complete ship sequence
- Never suggest creating a PR or opening a GitHub release for this repo
