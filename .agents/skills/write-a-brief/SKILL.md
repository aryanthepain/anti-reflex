---
name: write-a-brief
description: Generate a brief markdown memo in briefs/ from a rough idea provided by the user. Use when the user wants to write a new brief, scoping memo, weekly memo, week kickoff note, phase kickoff, or any short first-person memo that scopes upcoming work.
---

This skill is invoked when the user wants to create a new brief. Briefs are short, first-person memos (casual internal-memo tone) that scope a piece of work — usually a week or phase of the project — and live in `briefs/` at the repo root.

This is the FIRST stage of the brief → PRD → issues → ralph workflow. Before doing anything, read `.agents/skills/_shared/workflow.md` — it defines the stage folders, the brief frontmatter contract, and the git conventions that every skill in the workflow relies on. The brief you produce is the handoff artifact for `grill-me`, so it must carry correct frontmatter.

Follow these steps. Skip a step only if the user has already provided the information.

## 1. Get the rough idea

Ask the user for a rough, high-level description of what the brief is about. One short prompt is enough — do not pre-load it with assumptions. Example:

> "Give me a rough idea of what this brief should cover — topic, what week/phase, and anything you already know you want in it."

Wait for their answer before doing anything else.

If the rough idea is under ~2 sentences or lacks a clear topic, do not move on. Ask one short follow-up to get more context before proceeding to step 3 — do not invent a topic from a vague prompt.

## 2. Skim repo for light context

Do a lightweight pass for context only:
- List the `briefs/` folder to see existing briefs and the current numbering.
  - If `briefs/` does not exist or is empty, skip the rest of this step — there is no prior art to skim. Fall back to the tone/structure guidance in step 5.
- If briefs exist, skim 1–2 of the most relevant ones to match tone and structure.
- Optionally peek at `prd/`, `issues/`, or `project-1pager.md` if the topic clearly connects. These are optional too — skip silently if missing.

Weight the user's own words far more than anything found in the repo. Do not invent scope, deliverables, or signals that the user did not mention. If the repo suggests something that conflicts with the user's idea, surface it as a clarifying question rather than assuming.

## 3. Ask 3–5 clarifying questions

Use the `vscode_askQuestions` tool with 3–5 focused questions. Only ask what is genuinely needed to write the brief — skip anything you can reasonably infer from the user's rough idea or from the repo.

Good candidates (pick the relevant ones, do not ask all):
- Specific signals, data sources, or scope items in/out
- Open questions the user already wants surfaced
- Deliverables or outputs to commit to
- Any explicit non-goals
Add any other questions that are needed to clarify the user's intent.

Provide sensible recommended defaults in options where possible. Allow freeform input.

After this first set of answers, you MAY ask a few more follow-up questions ONLY if something genuinely necessary to write the brief is still unresolved. Keep it minimal — at most one short follow-up round, and skip it entirely if you already have enough. Do not pad with nice-to-have questions.

## 4. Show a draft outline first

Before writing the file, post a short outline (section headers + a one-line summary of what each will contain, plus the proposed filename) and ask the user to confirm or adjust. Do not write the file until they approve.

## 5. Write the file

Path: `briefs/<N>-<slug>.md` (new briefs always start in `briefs/` itself — the `new` stage).

- `<N>` = next integer after the highest existing number across **all** brief stage folders, not just `briefs/`. Briefs move into stage subfolders (`grilling-done/`, `prd-written/`, `critiqued/`, `issues-written/`, `done/`) as the workflow progresses, so you MUST scan all of them to avoid reusing a number. Scan `briefs/*.md` and `briefs/grilling-done/*.md`, `briefs/prd-written/*.md`, `briefs/critiqued/*.md`, `briefs/issues-written/*.md`, `briefs/done/*.md`. Ignore `briefs/for_manager/`.
  - If the `briefs/` folder does not exist, create it and use `1`.
  - If no `<N>-<slug>.md` files exist anywhere, use `1`.
  - If existing files do not follow the `<N>-<slug>.md` pattern, ignore them for numbering and start at the next integer after the highest one that does match.
- `<slug>` = short, lowercase, underscore-separated phrase derived from the topic (e.g., `eda_mfa_data`, `service_tree_mapping_followup`). Keep it under ~5 words.
- If the target path already exists, bump `<N>` to the next free integer rather than overwriting. Never overwrite an existing brief without explicit user confirmation.

### Frontmatter (required — this is the handoff contract)

Every brief MUST begin with YAML frontmatter so the next skill (`grill-me`) can pick it up without guessing. See `.agents/skills/_shared/workflow.md` §2 for the full contract. Write it exactly like this, filling in `slug`/`title` and leaving the rest at their defaults:

```yaml
---
slug: <N>-<slug>           # matches the filename without .md
title: <human title>
stage: new
branch: null
parent_branch: main
prd: null
gaps_file: null
---
```

### Tone

- Casual internal memo, first-person, from the user to the audience.
- Plain prose with light Markdown structure (headings, short bullet lists).
- No corporate filler.
- If prior briefs exist in `briefs/`, match their voice. If none exist, default to a short, plain-spoken memo voice — like a Slack-length note expanded into Markdown.

### Author

Briefs are first-person. To attribute the author when a section calls for it:

1. Check `/memories/repo/` for a stored brief-author name and use it if present.
2. If absent, reuse a consistent author name from prior briefs.
3. If neither is available, ask the user once for the name, then store it in repo memory (e.g., `/memories/repo/workflow.md`) so future runs do not re-ask. Do not add an email-style signature block.

### Structure (flexible — adapt to the topic)

There is no fixed template. Use whichever of these sections actually serve the topic, in whatever order makes sense:

- A short framing paragraph (what's going on, why now)
- Goal of this work
- Scope (what's in, what's tight)
- Key questions / things to figure out
- Deliverables
- Open questions / risks
- Out of scope

Length guidance:
- If prior briefs exist in `briefs/`, match their rough length.
- If none exist, aim for roughly 1 page of Markdown (~150–400 words). Briefs are scoping memos, not PRDs — err on the shorter side.
- Always prefer dropping a section over padding it with filler.

### Do not

- Do not add sections the user didn't ask for just to look thorough.
- Do not fabricate data fields, schemas, or numbers.
- Do not include code blocks or implementation details — briefs are scoping documents.
- Do not create the file before the user has approved the outline.

## 6. Confirm

After writing, tell the user the path of the new brief in one short sentence, and mention that the next step is `grill-me`. Do not summarize the contents back to them.
