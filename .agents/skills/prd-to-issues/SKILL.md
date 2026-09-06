---
name: prd-to-issues
description: Break a PRD into independently-workable issues and write each as a local markdown file in issues/. Use when the user wants to turn a PRD into a list of concrete tasks.
---

# PRD to Issues

Break a PRD into independently-grabbable issues using vertical slices (tracer bullets), written as local markdown files.

This is the fifth stage of the brief → PRD → issues → ralph workflow. Its inputs are a brief at stage `critiqued` (in `briefs/critiqued/`), its PRD, and the critique gaps file. It first applies the gaps to the PRD, then slices it into issues.

## Process

### 0. Shared conventions, locate inputs, and git setup

Read `.agents/skills/_shared/workflow.md` for the frontmatter contract, stage folders, and git decision tree. Then locate the brief (usually `briefs/critiqued/<slug>.md`) and read its frontmatter to find `prd:` and `gaps_file:`. Read both the PRD and the gaps file.

Resolve git setup before any work (same rules as `write-a-prd`):

1. Detect whether a branch already exists for this brief (frontmatter `branch:`, or `git branch --list 'brief/<slug>'` / `git branch -r --list 'origin/brief/<slug>'`).
   - **If a branch already exists:** check it out and continue in it. Do NOT create a new branch or re-ask.
2. **If no branch exists**, ask the branch + parent questions (shared file §3), then create/checkout and write `branch:`/`parent_branch:` into the brief frontmatter.
3. **If you cannot determine** whether a branch exists, just ask the user.
4. Ensure a clean working tree before switching branches; if dirty, stop and ask the user to resolve it.

### 1. Apply the gaps file to the PRD

Before slicing, revise the PRD using the gaps file (`gaps_file:`). Work through each gap in severity order (blocker → major → minor), applying its **Suggested fix** to the PRD text. After applying a gap, check off its `Status` in the gaps file (`[x]`). If a gap cannot be applied (e.g. it needs a human decision), leave it open and surface it to the user instead of guessing.

If the gaps file's overall assessment says the PRD needs a full rewrite, stop and use the "moving back" procedure instead of slicing.

Show the user a short summary of the PRD changes you made and get a quick confirmation before slicing.

### 2. Explore the codebase (optional)

If you have not already explored the codebase, do so to understand the current state of the code.

### 3. Draft vertical slices

Break the PRD into **tracer bullet** issues. Each issue is a thin vertical slice that cuts through ALL integration layers end-to-end, NOT a horizontal slice of one layer.

Slices may be 'HITL' or 'AFK'. HITL slices require human interaction, such as an architectural decision or a design review. AFK slices can be implemented and merged without human interaction. Prefer AFK over HITL where possible.

<vertical-slice-rules>
- Each slice delivers a narrow but COMPLETE path through every layer (schema, API, UI, tests)
- A completed slice is demoable or verifiable on its own
- Prefer many thin slices over few thick ones
</vertical-slice-rules>

### 4. Quiz the user

Present the proposed breakdown as a numbered list. For each slice, show:

- **Title**: short descriptive name
- **Type**: HITL / AFK
- **Blocked by**: which other slices (if any) must complete first
- **User stories covered**: which user stories from the PRD this addresses

Ask the user:

- Does the granularity feel right? (too coarse / too fine)
- Are the dependency relationships correct?
- Should any slices be merged or split further?
- Are the correct slices marked as HITL and AFK?

Iterate until the user approves the breakdown.

### 5. Create the issue files

For each approved slice, write a markdown file in `issues/` using the naming pattern `issues/NNN-short-title.md` (e.g. `issues/001-add-user-auth.md`).

Number issues starting from the next available number (check what files already exist in `issues/`).

Create files in dependency order (blockers first) so you can reference real filenames in the "Blocked by" field.

Do NOT use `gh issue create` or any GitHub CLI commands. Do NOT reference GitHub issue numbers. Use local filenames for all cross-references.

<issue-template>
---
type: afk            # afk | hitl  (ralph only works afk issues)
brief: <slug>        # the originating brief slug
parent_prd: prd/<name>.md
branch: brief/<slug> # the feature branch this issue's work belongs on
parent_branch: main  # base branch the PR for this work targets
---

## Parent PRD

`prd/<name>.md` (the PRD this slice came from)

## What to build

A concise description of this vertical slice. Describe the end-to-end behavior, not layer-by-layer implementation. Reference specific sections of the parent PRD rather than duplicating content.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Blocked by

- Blocked by `issues/NNN-title.md` (if any)

Or "None - can start immediately" if no blockers.

## User stories addressed

Reference by number from the parent PRD:

- User story 3
- User story 7

</issue-template>

The `type`, `branch`, and `parent_prd` frontmatter let the ralph loop group issues into branches/PRs without guessing. Set `type` to match the HITL/AFK decision from the quiz step. All issues from one brief share the same `branch` and `parent_branch`.

Do NOT modify the parent PRD file during slicing (step 1 is the only place the PRD is edited).

### 6. Finish — advance the stage

After all issue files are written:

1. Update the brief frontmatter: `stage: issues-written`.
2. Move the brief file into `briefs/issues-written/` using the shared "Moving forward" move + verification procedure in `.agents/skills/_shared/workflow.md`: relocate (do NOT copy) with a real move command (`git mv` if tracked, else `Move-Item`/`mv`), keep the `<N>-<slug>.md` filename, and afterwards confirm the brief no longer exists in `briefs/critiqued/` and now lives in exactly one folder.
3. Commit the applied-gaps PRD edits and the new issue files on the brief's branch.
4. Tell the user: how many issues were created, the brief's new path, the branch, and that the next step is the ralph loop (`.ralph/`).

### Moving back (error recovery)

If slicing reveals the PRD (even after gaps applied) is not ready, follow the shared "moving back" procedure: move the brief back to `briefs/critiqued/` (stage `critiqued`) and append a dated note under `## Workflow log`. Do not delete the issue files you already wrote unless the user asks — just tell them they may be stale.
