# ISSUES

Local issue files from `issues/` are provided at start of context. Parse them to understand the open issues.

You will work on the AFK issues only (label `afk`), not the HITL ones (label `hitl`).

Also review the recent git log to understand what work has been done.

If all AFK tasks are complete, FIRST run the END-OF-LOOP WRAP-UP (open any missing PRs and send the notification), THEN output <promise>NO MORE TASKS</promise>.

# TASK SELECTION

Pick the next task. Prioritize tasks in this order:

1. Critical bugfixes
2. Development infrastructure

Getting development infrastructure like tests and types and dev scripts ready is an important precursor to building features.

3. Tracer bullets for new features

Tracer bullets are small slices of functionality that go through all layers of the system, allowing you to test and validate your approach early. This helps in identifying potential issues and ensures that the overall architecture is sound before investing significant time in development.

TL;DR - build a tiny, end-to-end slice of the feature first, then expand it out.

4. Polish and quick wins
5. Refactors

# EXPLORATION

Explore the repo.

# BRANCH SETUP

Issues carry frontmatter (`type`, `brief`, `parent_prd`, `branch`, `parent_branch`). Use it to put work on the RIGHT branch. The goal is good branching: one branch (and later one PR) per unit of work, where a "unit" is a brief / parent PRD. Keep the number of branches as SMALL as possible — only create an extra branch when the issues genuinely come from a different brief/PRD that warrants its own PR.

Decide the branch for the task you selected:

1. Read the selected issue's `branch` and `parent_branch` frontmatter.
   - If `branch` is missing, fall back to grouping by `parent_prd`: all issues sharing a `parent_prd` belong on one branch named `brief/<slug>` (from the issue's `brief`), based on `parent_branch` (default `main`; if `main` is absent, use the repo's default branch).
2. Check the working tree is clean first:

```sh
git branch --show-current
git status
```

**If there are uncommitted changes:** Stop immediately and inform the user — do not switch branches over a dirty tree.

3. Check out (or create) the issue's branch off its parent:

```sh
git fetch
# if the branch already exists locally or on origin, check it out:
git checkout <branch> 2>/dev/null || git checkout -b <branch> <parent_branch>
git pull --ff-only 2>/dev/null   # best-effort
```

Only ONE branch is touched per iteration (you work a single task). Do not create branches that no selected issue maps to.

# IMPLEMENTATION

Use /tdd to complete the task.

Apply TDD to **both** the Python backend and the React frontend.

## Backend (Python)

- Write tests in `backend/tests/` using `pytest`.
- Run with `backend/.venv/Scripts/pytest` from the repo root (always inside the backend virtual environment).

## Frontend (React + Vite + TypeScript)

- Testing framework: **Vitest** (built-in Vite integration, no extra config needed).
- Component/DOM testing: **React Testing Library** (`@testing-library/react` + `@testing-library/user-event`).
- JSDOM environment: add `@testing-library/jest-dom` for matcher extensions.
- Test files live in `frontend/tests/` (e.g. `frontend/tests/App.test.tsx`). Name them after the module they cover.
- Run frontend tests with `npm test` (or `npx vitest run`) from the `frontend/` directory.
- Follow the same red → green → refactor loop: write a failing component/hook test first, then implement the feature, then clean up.

# FEEDBACK LOOPS

Before committing, run all feedback loops:

**Backend:**
- `cd backend && .venv/Scripts/pytest` to run Python tests
- `cd backend && .venv/Scripts/mypy .` to run the type checker

**Frontend:**
- `cd frontend && npm test -- --run` to run Vitest tests (non-watch mode)
- `cd frontend && npx tsc --noEmit` to type-check TypeScript

# COMMIT

Make a git commit. The commit message must:

1. Include key decisions made
2. Include files changed
3. Blockers or notes for next iteration

# FINISHING UP

If the task is complete, move the issue file to `issues/done/`.

If the task is not complete, add a note to the issue file with what was done.

## Pull request for a finished branch

After moving an issue to `issues/done/`, check whether ALL issues for that branch (same `branch` / `parent_prd`) are now in `issues/done/`. If they are, the branch is finished:

1. Push the branch: `git push -u origin <branch>`.
2. Open a PR to its parent branch if one does not already exist:

```sh
gh pr view <branch> >/dev/null 2>&1 || gh pr create --base <parent_branch> --head <branch> \
  --title "<brief slug>: <short summary>" \
  --body "Implements issues from <parent_prd>. Closes the work for brief <brief slug>."
```

3. Record the PR URL (from `gh pr view <branch> --json url -q .url`) — you will need it for the notification.

4. Advance the brief to the `pr-created` stage (the automated loop's terminal stage for a brief):
   - Find the brief's slug from the issue frontmatter `brief: <slug>`; its file is `<slug>.md`, normally in `briefs/issues-written/` (search the other `briefs/` stage folders if it is not there).
   - Idempotency: if the brief already lives in `briefs/pr_created/`, leave it as-is and skip the move.
   - Otherwise create `briefs/pr_created/` if missing, then move (NOT copy) the brief there using the shared §1 "Moving forward" move + verification procedure in `.agents/skills/_shared/workflow.md`:

```sh
mkdir -p briefs/pr_created
git mv briefs/issues-written/<slug>.md briefs/pr_created/<slug>.md
```

   - Set the brief's `stage:` frontmatter to `pr-created` while preserving all other frontmatter fields.
   - VERIFY the brief now lives in exactly one folder: `git status` should show a rename and the old path must be gone.
   - Commit the move on the brief's branch.

If the branch still has open issues, do nothing here; the PR is opened only once the branch is fully done.

# END-OF-LOOP WRAP-UP

Run this ONLY when there are no more AFK tasks left (right before emitting the NO MORE TASKS promise):

1. Ensure every branch that has completed work has an open PR to its parent (use the PR step above for any that are missing).
2. Collect the PR URLs: `gh pr list --state open --json url,title,headRefName`.
3. Send a GitHub-native notification to the user. Read the notify email from `/memories/repo/workflow.md` (currently `t-guptaaryan@microsoft.com`); GitHub email notifications reach it. Create a summary issue that @-mentions the user so GitHub emails them:

```sh
gh issue create --title "Ralph loop complete — <date>" --body "<summary>"
```

The issue/notification body MUST contain:
   - A short summary of what the loop accomplished (issues completed, branches touched).
   - A direct link to EACH PR that was opened (one per finished branch — there may be several).
   - Any blockers/notes for follow-up.

If `gh` cannot create an issue (no remote / auth), instead write the same summary to `.ralph/last-run-summary.md` so it is not lost, and note that in your output.

# CONSTRAINTS

- Only read, write, or execute files within the repository root. Never access paths outside it.
- Do not install packages globally or modify anything outside the repo (no system config, no other directories).
- All Python commands (`pytest`, `mypy`, package installs) must run inside the backend's virtual environment (`backend/.venv/`). Never use the system Python.
- All frontend commands (`npm test`, `npx tsc`) must run from the `frontend/` directory.

# FINAL RULES

- ONLY WORK ON A SINGLE TASK
- DO NOT USE SUBAGENTS
- DO NOT ASK ANY QUESTIONS
