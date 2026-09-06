---
name: write-a-prd
description: Generate a PRD from the client brief and write it as a local markdown file in issues/. Use when the user wants to turn a client request into a structured PRD.
---

This skill will be invoked when the user wants to create a PRD. You may skip steps if you don't consider them necessary.

This is the third stage of the brief → PRD → issues → ralph workflow. The input is a brief at stage `grilling-done` (in `briefs/grilling-done/`).

### 0. Shared conventions, locate the brief, and git setup

First read `.agents/skills/_shared/workflow.md` for the frontmatter contract, stage folders, and git decision tree. Then locate the brief this PRD is for (usually in `briefs/grilling-done/`) and read it, including its frontmatter and any `## Grilling outcomes` section.

Resolve git setup before the design work:

1. Detect whether a branch already exists for this brief (frontmatter `branch:`, or `git branch --list 'brief/<slug>'` / `git branch -r --list 'origin/brief/<slug>'`).
   - **If a branch already exists** (e.g. grill-me created one): just check it out and continue in it. Do NOT create a new branch and do NOT re-ask the branch/parent questions.
2. **If no branch exists**, ask the branch + parent questions (shared file §3): create `brief/<slug>`? change parent (default `main`)? Then create/checkout as described there and write `branch:`/`parent_branch:` into the brief frontmatter.
3. **If you cannot determine** whether a branch was already created for this brief, just ask the user directly rather than guessing.
4. Ensure a clean working tree before switching branches; if dirty, stop and ask the user to resolve it.

1. Ask the user for a long, detailed description of the problem they want to solve and any potential ideas for solutions.

2. Explore the repo to verify their assertions and understand the current state of the codebase.

3. Interview the user relentlessly about every aspect of this plan until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

4. Sketch out the major modules you will need to build or modify to complete the implementation. Actively look for opportunities to extract deep modules that can be tested in isolation.

A deep module (as opposed to a shallow module) is one which encapsulates a lot of functionality in a simple, testable interface which rarely changes.

Check with the user that these modules match their expectations. Check with the user which modules they want tests written for.

5. Once you have a complete understanding of the problem and solution, use the template below to write the PRD. The PRD should be written as a local markdown file at `prd/<name>.md`. Create the `prd/` directory if it doesn't exist. Do NOT submit a GitHub issue or call any external service.

<prd-template>

## Assumptions

A SHORT bulleted list (3–7 items) of the key assumptions this PRD rests on — data availability, access, scope boundaries, decisions inherited from the brief/grilling, and anything taken as given but not yet verified. This sits at the very top so the critique skill and downstream readers can challenge the foundations first.

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this PRD.

## Further Notes

Any further notes about the feature.

</prd-template>

### 6. Finish — link the PRD and advance the stage

After writing the PRD:

1. Update the brief frontmatter: set `prd:` to the PRD path (e.g. `prd/<name>.md`) and `stage: prd-written`.
2. Move the brief file into `briefs/prd-written/` using the shared "Moving forward" move + verification procedure in `.agents/skills/_shared/workflow.md`: relocate (do NOT copy) with a real move command (`git mv` if tracked, else `Move-Item`/`mv`), keep the `<N>-<slug>.md` filename, and afterwards confirm the brief no longer exists in `briefs/grilling-done/` and now lives in exactly one folder. The PRD itself stays in `prd/`.
3. Tell the user the PRD path, the brief's new path, the branch they are on, and that the next step is `critique`.

### Moving back (error recovery)

If the design work shows the brief needs more grilling, follow the shared "moving back" procedure: move the brief back to `briefs/grilling-done/` (stage `grilling-done`) and append a dated note under `## Workflow log`. If a PRD was already partially written and is now invalid, tell the user it may be stale rather than deleting it.
