# Pre-Implementation Requirements Quality Checklist: PDF Recipe Import

**Purpose**: Full-coverage quality gate — validate that all requirement domains are complete, clear, and unambiguous before implementation begins
**Created**: 2026-05-29
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md) | [contracts/api.md](../contracts/api.md)
**Depth**: Pre-implementation gate | **Audience**: Author (self-review before coding) | **Scope**: All domains

---

## Requirement Completeness

- [ ] CHK001 — Are classification criteria defined for what constitutes an "ingredient" versus an "instruction" from the extracted text? [Gap]
- [ ] CHK002 — Are requirements defined for what "confident identification" means — is a confidence threshold or classification rule documented anywhere in requirements (not just plan)? [Gap, Spec §Assumptions]
- [ ] CHK003 — Are requirements specified for how uncategorized text blocks are surfaced to the user in the review screen? [Gap, Spec §Assumptions]
- [ ] CHK004 — Are requirements defined for whether the user can add new ingredients or instructions that were not in the original PDF (net-new rows, not just edits)? [Gap, Spec §FR-006]
- [ ] CHK005 — Is the expected post-save user state specified? (e.g., redirect to recipe detail page, confirmation message, return to upload form) [Gap]
- [ ] CHK006 — Are requirements defined for the visibility of draft recipes — are they excluded from recipe listings, search, or any public-facing surface? [Completeness, Spec §FR-012]
- [ ] CHK007 — Is there a requirement covering what happens when the user leaves or closes the browser mid-review (before saving)? [Gap, Coverage]

---

## Requirement Clarity

- [ ] CHK008 — Is the distinction between "no extractable text" (User Story 3, Scenario 1) and "insufficient content" (FR-011) clearly defined with observable criteria for each? [Ambiguity, Spec §FR-011]
- [ ] CHK009 — Is "correctly identifies" in SC-002 defined with a measurable, observable test condition (e.g., how is correctness determined — exact match, manual review, diff against ground truth)? [Ambiguity, Spec §SC-002]
- [ ] CHK010 — Is "development mode" scoped precisely enough for implementation? Does it cover local only, or also staging environments? [Ambiguity, Spec §FR-001]
- [ ] CHK011 — Are "clear error message" requirements (content, tone, placement in the UI) specified for FR-009, FR-010, and FR-011 — or is "clear" left to implementer discretion? [Ambiguity, Spec §FR-009, FR-010, FR-011]
- [ ] CHK012 — Is the 3-minute completion time in SC-003 defined with explicit start and end points? (e.g., from file selection to redirect to recipe detail?) [Ambiguity, Spec §SC-003]

---

## Requirement Consistency

- [ ] CHK013 — Is the maximum PDF file size consistent across all artifacts? The spec says "will be determined during planning" but contracts and SC-001 both specify 10 MB — is the spec's assumption section updated to reflect this? [Consistency, Spec §Assumptions, SC-001]
- [ ] CHK014 — Is the 422 response behavior (client renders review screen with empty fields) consistent with FR-011's requirement that the user "proceed with manual entry"? [Consistency, Spec §FR-011, Contracts §extract]
- [ ] CHK015 — Is FR-012's draft-status default consistent with the data model's `DEFAULT 'published'` for existing recipes and `DEFAULT 'draft'` for new imports — and is this distinction explicit in requirements? [Consistency, Spec §FR-012, data-model.md]
- [ ] CHK016 — Are the requirements for what the user can edit (FR-006: title, ingredients, instructions) consistent with the ImportDraft type which also includes an `uncategorized` field? Is editing of uncategorized content in scope? [Consistency, Spec §FR-006]

---

## Acceptance Criteria Quality

- [ ] CHK017 — Can SC-002's 80% accuracy target be objectively measured before release? Is a test dataset or measurement methodology defined? [Measurability, Spec §SC-002]
- [ ] CHK018 — Is SC-001's 15-second target broken down by stage (upload, pdf-parse, Claude API call, response) to make it actionable for investigation when the target is missed? [Clarity, Spec §SC-001]
- [ ] CHK019 — Is SC-004's "clear explanation" requirement measurable — what qualifies as a sufficient explanation when an import cannot be completed? [Measurability, Spec §SC-004]

---

## Scenario Coverage

- [ ] CHK020 — Are requirements defined for cancellation during active extraction (while the loading indicator is shown, before the review screen appears)? [Gap, Coverage]
- [ ] CHK021 — Are requirements specified for the recovery path when extraction succeeds but the save step fails (user has reviewed but the DB write errors)? [Gap, Exception Flow]
- [ ] CHK022 — Is the scenario covered where the user clears the pre-populated title on the review screen and attempts to save with an empty title? [Coverage, Spec §Assumptions]
- [ ] CHK023 — Are requirements defined for saving a recipe with zero ingredients or zero instructions (user removed all items during review)? Is this allowed? [Coverage, Gap]

---

## Edge Case Coverage

- [ ] CHK024 — Is the multi-page PDF edge case resolved with a defined requirement? Currently listed as open with no FR assigned. [Gap, Spec §Edge Cases]
- [ ] CHK025 — Is the non-English PDF edge case resolved with a defined requirement or explicit out-of-scope statement? [Gap, Spec §Edge Cases]
- [ ] CHK026 — Are requirements defined for timeout behavior when extraction exceeds the 15-second target? (e.g., cancel the request, show an error, allow retry) [Gap, Spec §SC-001]
- [ ] CHK027 — Are atomicity requirements specified for the three-table write operation? Is partial failure (recipe saved, ingredient_entries fail) defined and handled? [Gap, data-model.md]
- [ ] CHK028 — Are requirements defined for UID generation failure when the recipe title produces an empty or invalid slug? [Gap, data-model.md §UID Generation]

---

## Security & Auth Requirements

- [ ] CHK029 — Is the dev-mode auth bypass formally specified as a requirement (not just described in plan assumptions)? Are its exact preconditions documented in the spec? [Gap, Spec §FR-001]
- [ ] CHK030 — Are security constraints on the service role key documented in requirements — specifically that it must never be used in production paths? [Gap]
- [ ] CHK031 — Are requirements defined to prevent a forged or replayed POST /api/import/save request that was not preceded by a valid extraction step? [Gap, Coverage]

---

## Non-Functional Requirements

- [ ] CHK032 — Are accessibility requirements specified for the PDF upload form? (e.g., keyboard operability, screen reader labels, ARIA roles) [Gap]
- [ ] CHK033 — Are accessibility requirements specified for the loading indicator shown during extraction? (e.g., ARIA live region, focus management) [Gap]
- [ ] CHK034 — Are mobile or responsive layout requirements defined for the review screen — or is desktop-only explicitly accepted? [Gap]
- [ ] CHK035 — Are rate limiting or request throttling requirements specified for the extract endpoint to guard against large-file abuse? [Gap]
- [ ] CHK036 — Are logging or observability requirements specified for extraction failures? (e.g., what is logged when Claude returns an error or pdf-parse throws) [Gap]

---

## Dependencies & Assumptions

- [ ] CHK037 — Is the assumption that the Claude API is always available addressed? Are requirements defined for degraded behavior when the Claude API is rate-limited or unreachable? [Assumption, Gap]
- [ ] CHK038 — Is the one-PDF-one-recipe constraint formally elevated from an assumption to a functional requirement with a defined user-facing message when the constraint is encountered? [Traceability, Spec §Assumptions]
- [ ] CHK039 — Are the two new environment variables (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) documented as deployment requirements in the spec or quickstart? [Completeness, Spec §Assumptions]
- [ ] CHK040 — Is the no-OCR constraint formally stated as a functional limitation to users — not just as an internal implementation decision? [Completeness, Spec §Assumptions]

---

## Notes

- Check items off as completed: `[x]`
- Add inline notes when an item reveals a gap that needs a spec update
- Items marked `[Gap]` represent missing requirements — each should result in either a new FR or an explicit out-of-scope decision recorded in the spec
- Items marked `[Ambiguity]` represent written requirements that need clarification before they can be implemented unambiguously
