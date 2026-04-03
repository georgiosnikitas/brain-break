---
title: 'Align ASCII Art Planning Docs'
type: 'chore'
created: '2026-04-03'
status: 'complete'
context:
  - 'docs/planning-artifacts/prd.md'
  - 'docs/planning-artifacts/epics.md'
  - 'docs/planning-artifacts/architecture.md'
---

# Align ASCII Art Planning Docs

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The shipped ASCII Art feature is documented inconsistently. PRD and epics describe the screen as deterministic even though the implementation randomly selects one of 14 FIGlet fonts per render, and architecture still omits the feature entirely from its feature inventory, screen trees, and coverage tables.

**Approach:** Update the planning artifacts to describe the current implementation exactly: local `figlet` rendering, randomized font choice, instant no-network behavior, and the dedicated router/menu/screen architecture. Preserve the shipped behavior and preserve existing local edits in the working tree.

## Boundaries & Constraints

**Always:** Keep the current runtime behavior as the source of truth; preserve any existing uncommitted work that is unrelated to the requested doc sync; make the minimum set of documentation changes needed to remove contradictions; keep architecture terminology and table structure consistent with the rest of the document.

**Ask First:** If investigation shows the product decision should change from randomized fonts to deterministic rendering, or if any stale document requires a broader redesign instead of a localized sync.

**Never:** Change the ASCII Art runtime behavior, revert unrelated working-tree edits, renumber unrelated architecture features, or rewrite planning sections that are already aligned.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Planning sync | PRD, epics, and architecture mention the ASCII Art feature | PRD and epics describe randomized FIGlet rendering accurately; architecture includes the feature in overview text, dependency notes, screen trees, feature mapping, and coverage validation | N/A |
| Existing local edits | The same files already contain uncommitted changes | New edits layer on top of the current working tree without discarding or rewriting unrelated modifications | Preserve all unrelated hunks and only patch the stale lines |
| Related supporting docs | Implementation story or cleanup notes still repeat the stale deterministic wording | Supporting docs are adjusted only where they would otherwise keep the contradiction alive for future agents | Leave unrelated deterministic-testing references untouched |

</frozen-after-approval>

## Code Map

- `docs/planning-artifacts/prd.md` -- Product-level feature definition for ASCII Art and domain sub-menu behavior.
- `docs/planning-artifacts/epics.md` -- Epic 12 and Story 12.1 acceptance criteria for the shipped feature.
- `docs/planning-artifacts/architecture.md` -- Architecture inventory, dependency notes, module trees, and feature coverage tables.
- `docs/implementation-artifacts/12-1-ascii-art-screen.md` -- Story artifact that future agents may consult while implementing or reviewing the feature.
- `docs/planning-artifacts/ux-cleanup-backlog.md` -- Cleanup note that currently repeats stale deterministic wording.

## Tasks & Acceptance

**Execution:**
- [ ] `docs/planning-artifacts/prd.md` -- replace the stale deterministic claim with wording that matches the current randomized-but-local rendering behavior -- keep the existing Feature 18 edits intact.
- [ ] `docs/planning-artifacts/epics.md` -- update Epic 12 / Story 12.1 wording to match the implemented randomized font behavior -- preserve current story structure and acceptance criteria style.
- [ ] `docs/planning-artifacts/architecture.md` -- add the missing ASCII Art feature to overview text, dependency notes, module trees, feature mapping, and requirements coverage -- make the architecture reflect the live router/menu/screen structure.
- [ ] `docs/implementation-artifacts/12-1-ascii-art-screen.md` -- remove stale deterministic phrasing that would otherwise contradict the implementation story record.
- [ ] `docs/planning-artifacts/ux-cleanup-backlog.md` -- update the resolved ASCII Art note so it no longer misstates the feature behavior.

**Acceptance Criteria:**
- Given the current ASCII Art implementation, when a reader compares planning docs to `src/screens/ascii-art.ts`, then all docs consistently describe local FIGlet rendering with randomized font selection and no AI/network dependency.
- Given the architecture document, when a reader looks for the ASCII Art feature, then they can find it in the requirements overview, screen trees, feature mapping, and requirements coverage validation.
- Given the dirty working tree, when the sync is complete, then unrelated local edits remain intact.

## Spec Change Log

## Design Notes

Architecture uses its own sequential feature inventory rather than PRD feature numbering. The doc sync should therefore add ASCII Art as the next architecture feature entry, while still referring to PRD Feature 18 where helpful in prose.

## Verification

**Commands:**
- `npm test -- src/screens/ascii-art.test.ts src/screens/domain-menu.test.ts src/router.test.ts` -- expected: all targeted ASCII Art tests pass.
- `rg -n "deterministic" docs/planning-artifacts/prd.md docs/planning-artifacts/epics.md docs/planning-artifacts/architecture.md docs/implementation-artifacts/12-1-ascii-art-screen.md docs/planning-artifacts/ux-cleanup-backlog.md` -- expected: no stale deterministic claim remains for the ASCII Art feature.