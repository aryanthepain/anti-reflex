# Shared Workflow Conventions

This file is the single source of truth for the brief → PRD → issues → ralph workflow.
The skills `write-a-brief`, `grill-me`, `write-a-prd`, `critique`, and `prd-to-issues`,
plus the ralph loop (`.ralph/prompt.md`), all reference it. Keep logic here, not copy-pasted.

---

## 1. The brief lifecycle (stage = folder)

A brief moves through ordered stages. The folder it lives in IS its stage. The order is:

| # | Stage           | Folder                    | Set by skill   |
|---|-----------------|---------------------------|----------------|
| 0 | `new`           | `briefs/`                 | write-a-brief  |
| 1 | `grilling-done` | `briefs/grilling-done/`   | grill-me       |
| 2 | `prd-written`   | `briefs/prd-written/`     | write-a-prd    |
| 3 | `critiqued`     | `briefs/critiqued/`       | critique       |
| 4 | `issues-written`| `briefs/issues-written/`  | prd-to-issues  |
| 5 | `pr-created`    | `briefs/pr_created/`      | ralph loop     |
| 6 | `done`          | `briefs/done/`            | manual (on PR merge) |

The ralph loop advances a brief to `pr-created` once it has implemented all of that brief's
issues and opened the PR for the brief's branch — this is the automated loop's terminal stage.
`done` is the post-merge stage: it is set MANUALLY when the PR merges, not by the automated
loop.

`briefs/for_manager/` is NOT a stage — never move workflow briefs into it and never treat
its files as workflow briefs.

If any of these stage folders does not exist, create it before moving a brief into it.

### Moving forward
When a skill finishes its stage, it MOVES the brief file into the next stage folder and updates
the brief's `stage:` frontmatter to match. "Move" means RELOCATE, never copy. The file keeps
its `<N>-<slug>.md` name across all folders. Follow this ordered procedure exactly:

1. A brief must exist in EXACTLY ONE stage folder at all times. "Move" means relocate, never
   copy — the file at the old path MUST be gone afterwards. Do NOT implement the move by
   creating/writing a new file in the destination and leaving the original behind.
2. Determine the source and destination paths (same `<N>-<slug>.md` filename in both); create
   the destination stage folder if it does not exist.
3. Move with a real move command: `git mv <src> <dst>` if the file is tracked, otherwise a
   plain filesystem move/rename (`Move-Item` on Windows, `mv` elsewhere) — never a copy.
4. Update the `stage:` frontmatter in the file at its NEW path.
5. VERIFY: confirm the destination exists AND the source no longer exists (e.g. `git status`
   shows a rename, not an add). If a stale copy remains in the old folder, delete it
   (`git rm <src>` if tracked, otherwise remove the file).

### Moving back (error recovery)
Every skill must support moving a brief BACK one or more stages when there is a problem
(validation failed, user says the previous stage was wrong, downstream artifact is bad). This
is the same relocate-and-verify move as "Moving forward", just toward an earlier stage:

1. Move the brief file to the target earlier stage folder using the ordered relocate procedure
   above (steps 1–5): relocate (never copy), use a real move command, and VERIFY the brief now
   exists in exactly one folder — the source path must be gone afterwards.
2. Update `stage:` frontmatter to that earlier stage.
3. Append a one-line dated note under a `## Workflow log` section at the bottom of the brief
   explaining why it moved back.
4. Do NOT delete downstream artifacts (PRD, gaps file) automatically — tell the user they may
   now be stale and ask whether to regenerate.

---

## 2. Brief frontmatter (the contract between skills)

Every brief carries YAML frontmatter. This is the machine-readable handoff so the next skill
never has to guess. Read it at the start of every skill; update it at the end.

```yaml
---
slug: 5-notebook_visualizations      # <N>-<slug>, matches the filename
title: Notebook Visualization Pass   # human title
stage: new                           # one of the stages in section 1
branch: null                         # feature branch for this brief, or null if none yet
parent_branch: main                  # base branch this work targets
prd: null                            # path to the PRD once written, e.g. prd/foo.md
gaps_file: null                      # path to the critique gaps file once written
---
```

Rules:
- `slug` always equals the filename without `.md`.
- Never invent values. If something has not happened yet, leave it `null`.
- When updating one field, preserve all the others.

---

## 3. Git branch conventions

### Naming
Feature branch for a brief is deterministic: **`brief/<slug>`** (e.g. `brief/5-notebook_visualizations`).
This lets any skill detect an existing branch even before reading frontmatter.

### Configured default parent branch
The configured default parent branch is stored in repo memory at
`/memories/repo/workflow.md`. If that file is missing, default to `main`.
If the configured/`main` branch does not exist in the repo, fall back to the repo's actual
default branch:

```sh
git symbolic-ref --quiet refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
# fallback if the above is empty:
git rev-parse --abbrev-ref HEAD
```

### Detecting whether a branch already exists for a brief
Use BOTH signals, in this order:
1. The brief's `branch:` frontmatter, if non-null.
2. `git branch --list 'brief/<slug>'` and `git branch -r --list 'origin/brief/<slug>'`.

If either indicates a branch exists, that brief already has a branch — **check it out**, do not
create a new one. If neither does, the brief has no branch yet.

### The "branch + parent" prompt (interactive skills only)
`grill-me`, `write-a-prd`, and `prd-to-issues` run interactively. Before their main work, they
must resolve git setup using this decision tree:

1. Detect an existing branch for the brief (above).
   - **If found:** check it out. Tell the user which branch. Skip to the skill's main work.
2. **If no branch found**, ask the user two questions (use the ask-questions tool):
   - "Create a new git branch for this brief?" (recommended: yes, name `brief/<slug>`)
   - "Change the parent/base branch first?" (default: the configured default parent)
3. If the user wants a new branch:
   ```sh
   git checkout <parent_branch>
   git pull --ff-only            # best-effort; skip if no remote/offline
   git checkout -b brief/<slug>
   ```
   Then write `branch:` and `parent_branch:` into the brief frontmatter.
4. If the user declines a branch, continue on the current branch and leave `branch:` null.

Before creating/switching branches, ensure the working tree is clean (`git status --short`).
If it is dirty, stop and ask the user to commit/stash/discard first — never force.

---

## 4. PRs and the ralph loop (headless)

- PRs are opened with the **`gh` CLI** (`gh pr create --base <parent> --head <branch>`).
- The ralph loop runs headless and must NOT ask questions. It resolves branches from issue
  frontmatter / `Parent PRD` grouping (see `.ralph/prompt.md`), never interactively.
- End-of-loop notification is **GitHub-native**: the summary + PR links go into the PR
  description and/or a GitHub issue that @-mentions the configured user, relying on GitHub
  email notifications. The user's notify email is stored in `/memories/repo/workflow.md`.
