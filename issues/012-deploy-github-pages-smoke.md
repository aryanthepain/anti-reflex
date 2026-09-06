---
type: hitl
brief: 1-anti_reflex_mvp
parent_prd: prd/anti-reflex-mvp.md
branch: brief/1-anti_reflex_mvp
parent_branch: main
---

## Parent PRD

`prd/anti-reflex-mvp.md` (the PRD this slice came from)

## What to build

Deployment to a public URL per the PRD *Deploy* contract, plus the manual smoke acceptance.

- Add a GitHub Actions workflow that **runs the Vitest suite first**, then publishes **only the static game artifact directory** (HTML/CSS/JS) to GitHub Pages — excluding tests, coverage, and `node_modules`.
- Auto-publish on push to `main`.
- Run the PRD manual **smoke checklist** against the live URL: page load, Start, keyboard play, touch/click play, three-strike game over, local best-score persistence, and share-card copy (including clipboard fallback).

This is **HITL**: it requires enabling GitHub Pages for the repo and a human verifying the live URL against the smoke checklist.

## Acceptance criteria

- [ ] Workflow runs Vitest and fails the deploy if tests fail.
- [ ] Only the static artifact is published; tests/coverage/dependencies are excluded.
- [ ] Pushing to `main` publishes the playable build to a public Pages URL.
- [ ] The manual smoke checklist passes on the live URL.

## Blocked by

- Blocked by `issues/010-juice-commentator-audio.md`
- Blocked by `issues/011-persistence-share-card.md`

## User stories addressed

- User story 33
