---
name: critique
description: Act as an LLM-as-a-judge on a freshly written PRD, find gaps, and emit a structured gaps file that another model can apply back to the PRD. Use when the user wants a PRD critiqued, reviewed, or stress-tested for gaps before breaking it into issues.
---

# Critique

This is the fourth stage of the brief → PRD → issues → ralph workflow. It runs right after `write-a-prd`. The job is to judge the PRD as an adversarial reviewer, surface gaps, and write a structured **gaps file** that the next skill (`prd-to-issues`) consumes to fix the PRD before slicing it into issues.

## 0. Use a different (stronger) judge model

This critique is most valuable when performed by a DIFFERENT model than the one that wrote the PRD — a fresh perspective catches what the author missed.

**Before doing the critique, instruct the user to switch the chat to a strong judge model** (their choice of a different, capable model) and confirm they have done so. If the user says they cannot or do not want to switch, proceed anyway but note in the gaps file that the critique was done by the same model family.

Do NOT spawn subagents for the judging — the critique runs in the main chat under the judge model.

## 1. Read the shared conventions and locate inputs

Read `.agents/skills/_shared/workflow.md` for the frontmatter contract and stage folders. Then locate:

- The brief (usually in `briefs/prd-written/`) and read its frontmatter — the `prd:` field points at the PRD.
- The PRD itself (`prd/<name>.md`).

If you cannot find the linked PRD, ask the user for its path. Do not invent one.

Stay on whatever branch the brief is already on (frontmatter `branch:`). This skill does not create branches.

## 2. Judge the PRD — find the gaps

Read the PRD critically, as an LLM-as-a-judge whose goal is to find everything that would make the downstream implementation go wrong. Look for, at minimum:

- **Ambiguity** — requirements that could be read two ways, undefined terms, vague acceptance criteria.
- **Missing requirements** — user stories or edge cases implied but not stated; error/empty/failure paths.
- **Unjustified or risky assumptions** — challenge the `## Assumptions` section directly. Are any assumptions false, unverified, or load-bearing?
- **Untestable statements** — anything that cannot be turned into a concrete test.
- **Scope / contradiction** — internal inconsistencies, scope creep, or conflicts with the brief's grilling outcomes.
- **Module / interface gaps** — interfaces that are too shallow, missing contracts, or coupling that hurts testability.
- **Out-of-scope leakage** — things listed in scope that should not be, or vice versa.

Do not rewrite the PRD here. Your output is recommendations, not edits — `prd-to-issues` applies them.

## 3. Write the gaps file

Write the gaps file at `briefs/critiqued/<slug>.gaps.md` (same `<slug>` as the brief). Create `briefs/critiqued/` if missing. The format below is designed to be applied mechanically by another model — keep every gap atomic and actionable.

<gaps-template>
---
brief: <slug>
prd: prd/<name>.md
judged_by: <model name you ran as, or "unknown">
date: <YYYY-MM-DD>
---

# PRD Gaps: <PRD title>

Each gap is an atomic, applyable instruction for revising the PRD. Apply highest severity first.

## G1 — <short title>
- **Severity:** blocker | major | minor
- **Location:** <section of the PRD this affects, e.g. "Assumptions", "User Stories #4">
- **Problem:** <what is wrong / missing / ambiguous, in one or two sentences>
- **Suggested fix:** <concrete change to make in the PRD — specific enough to apply directly>
- **Status:** [ ] open

## G2 — <short title>
- **Severity:** ...
- **Location:** ...
- **Problem:** ...
- **Suggested fix:** ...
- **Status:** [ ] open

<!-- ...as many gaps as warranted. If the PRD is genuinely solid, it is fine to record few or zero gaps and say so explicitly. -->

## Overall assessment
A short paragraph: is this PRD ready to slice into issues, ready-with-fixes, or does it need to go back to `write-a-prd`?
</gaps-template>

## 4. Finish — link the gaps file and advance the stage

1. Update the brief frontmatter: set `gaps_file:` to `briefs/critiqued/<slug>.gaps.md` and `stage: critiqued`.
2. Move the brief file into `briefs/critiqued/` using the shared "Moving forward" move + verification procedure in `.agents/skills/_shared/workflow.md`: relocate (do NOT copy) with a real move command (`git mv` if tracked, else `Move-Item`/`mv`), keep the `<N>-<slug>.md` filename, and afterwards confirm the brief no longer exists in `briefs/prd-written/` and now lives in exactly one folder. The gaps file already lives in `briefs/critiqued/`.
3. Give the user a brief summary: number of gaps by severity and the overall assessment. Tell them the next step is `prd-to-issues`, which will apply the gaps to the PRD before slicing it.

## Moving back (error recovery)

If the critique concludes the PRD is fundamentally broken (not fixable by gap-edits), follow the shared "moving back" procedure: move the brief back to `briefs/prd-written/` (stage `prd-written`), append a dated note under `## Workflow log` saying the PRD needs a rewrite, and tell the user. Still write the gaps file so the rewrite has a checklist.
