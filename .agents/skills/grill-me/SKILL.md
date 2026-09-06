---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

Interview the user relentlessly about every aspect of a plan or design until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer. Ask questions ONE AT A TIME. If a question can be answered by exploring the codebase, explore the codebase instead of asking.

This skill has two modes:

- **Brief mode** — the thing being grilled is a brief from `briefs/` (the second stage of the brief → PRD → issues → ralph workflow). Do the git setup and folder move described below.
- **Generic mode** — the user wants to be grilled on some other plan/design with no associated brief. Just do the relentless interview; skip the git and folder steps entirely.

Detect brief mode if the user points at a brief file, references a brief by name/number, or there is an obvious in-progress brief in `briefs/`. If ambiguous, ask which brief (or whether this is a generic grilling) before proceeding.

---

## Brief mode

### 0. Read the shared conventions

Read `.agents/skills/_shared/workflow.md`. It defines the brief frontmatter contract, the stage folders, and the git branch decision tree this skill uses. Then read the target brief (including its frontmatter).

### 1. Git setup — BEFORE any questions

Resolve git setup first, following the "branch + parent" decision tree in the shared file (§3):

1. Detect whether a branch already exists for this brief (frontmatter `branch:`, or `git branch --list 'brief/<slug>'` / `git branch -r --list 'origin/brief/<slug>'`).
   - **If a branch already exists:** check it out, tell the user which branch, and move on to step 2. Do not create a new one.
2. **If no branch exists**, ask the user (ask-questions tool, before the interview begins):
   - Whether to create a new git branch for this brief (recommended: yes, named `brief/<slug>`).
   - Whether to change the parent/base branch first (default: the configured default parent from repo memory / `main`).
3. Ensure the working tree is clean before switching branches. If dirty, stop and ask the user to commit/stash/discard — never force.
4. If creating a branch: `git checkout <parent>` → best-effort `git pull --ff-only` → `git checkout -b brief/<slug>`, then write `branch:` and `parent_branch:` into the brief frontmatter.
5. If the user declines a branch, stay on the current branch and leave `branch:` null.

### 2. Grill relentlessly

Now run the interview. One question at a time, each with your recommended answer, walking the decision tree and resolving dependencies. Explore the codebase to answer your own questions wherever possible. Capture the resolved decisions as you go.

### 3. Finish — record decisions and advance the stage

When the interview reaches shared understanding:

1. Append the resolved decisions to the brief under a `## Grilling outcomes` section (concise bullets of what was decided and why) so `write-a-prd` can build on them.
2. Update the brief frontmatter: `stage: grilling-done`.
3. Move the brief file into `briefs/grilling-done/` using the shared "Moving forward" move + verification procedure in `.agents/skills/_shared/workflow.md`: relocate (do NOT copy) with a real move command (`git mv` if tracked, else `Move-Item`/`mv`), keep the `<N>-<slug>.md` filename, and afterwards confirm the brief no longer exists in `briefs/` and now lives in exactly one folder.
4. Tell the user the new path, the branch they are on, and that the next step is `write-a-prd`.

### Moving back (error recovery)

If grilling reveals the brief itself is wrong/incomplete and should go back to drafting, follow the "moving back" procedure in the shared file: move the brief back to `briefs/` (stage `new`), set `stage: new`, and append a dated note under `## Workflow log` explaining why. Do not delete any downstream artifacts automatically.
