# Pre-Implementation Requirements Quality Checklist: PDF Recipe Import

**Purpose**: Full-coverage quality gate — validate that all requirement domains are complete, clear, and unambiguous before implementation begins
**Created**: 2026-05-29
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md) | [contracts/api.md](../contracts/api.md)
**Depth**: Pre-implementation gate | **Audience**: Author (self-review before coding) | **Scope**: All domains

---

## Requirement Completeness

- [X] CHK001 — Are classification criteria defined for what constitutes an "ingredient" versus an "instruction" from the extracted text? [Gap] → Added assumption: classification delegated to Claude LLM; model output is authoritative.
- [X] CHK002 — Are requirements defined for what "confident identification" means — is a confidence threshold or classification rule documented anywhere in requirements (not just plan)? [Gap, Spec §Assumptions] → Added assumption: no per-item confidence score; "confident" means parseable non-null response; SC-002 is post-launch benchmark.
- [X] CHK003 — Are requirements specified for how uncategorized text blocks are surfaced to the user in the review screen? [Gap, Spec §Assumptions] → Already covered in US3 Scenario 2 and Assumptions.
- [X] CHK004 — Are requirements defined for whether the user can add new ingredients or instructions that were not in the original PDF (net-new rows, not just edits)? [Gap, Spec §FR-006] → Extended FR-006: users MAY add new items during review.
- [X] CHK005 — Is the expected post-save user state specified? (e.g., redirect to recipe detail page, confirmation message, return to upload form) [Gap] → Added assumption: user is redirected to /recipes/{uid} after confirm.
- [X] CHK006 — Are requirements defined for the visibility of draft recipes — are they excluded from recipe listings, search, or any public-facing surface? [Completeness, Spec §FR-012] → Extended FR-012: draft recipes must not appear in listings or public surfaces.
- [X] CHK007 — Is there a requirement covering what happens when the user leaves or closes the browser mid-review (before saving)? [Gap, Coverage] → Out of scope: nothing persisted before confirm; browser close = no data loss, no action needed.

---

## Requirement Clarity

- [X] CHK008 — Is the distinction between "no extractable text" (User Story 3, Scenario 1) and "insufficient content" (FR-011) clearly defined with observable criteria for each? [Ambiguity, Spec §FR-011] → Updated FR-011 with two explicit cases: 422 for empty pdf-parse output; 200 with warning banners for empty Claude arrays.
- [X] CHK009 — Is "correctly identifies" in SC-002 defined with a measurable, observable test condition (e.g., how is correctness determined — exact match, manual review, diff against ground truth)? [Ambiguity, Spec §SC-002] → Already resolved: SC-002 labeled as post-launch benchmark, not a sprint gate.
- [X] CHK010 — Is "development mode" scoped precisely enough for implementation? Does it cover local only, or also staging environments? [Ambiguity, Spec §FR-001] → Updated clarification: process.env.NODE_ENV === 'development' (confirmed Next.js 16 best practice); staging with NODE_ENV=production is treated as production.
- [X] CHK011 — Are "clear error message" requirements (content, tone, placement in the UI) specified for FR-009, FR-010, and FR-011 — or is "clear" left to implementer discretion? [Ambiguity, Spec §FR-009, FR-010, FR-011] → Acceptable in v1: error text defined in contracts/api.md; tone and placement are implementer discretion.
- [X] CHK012 — Is the 3-minute completion time in SC-003 defined with explicit start and end points? (e.g., from file selection to redirect to recipe detail?) [Ambiguity, Spec §SC-003] → Updated SC-003: start = file selection, end = redirect to /recipes/{uid}; target updated to 5 minutes.

---

## Requirement Consistency

- [X] CHK013 — Is the maximum PDF file size consistent across all artifacts? The spec says "will be determined during planning" but contracts and SC-001 both specify 10 MB — is the spec's assumption section updated to reflect this? [Consistency, Spec §Assumptions, SC-001] → Already resolved in previous speckit-analyze session; spec Assumptions now reads "10 MB (determined during planning)."
- [X] CHK014 — Is the 422 response behavior (client renders review screen with empty fields) consistent with FR-011's requirement that the user "proceed with manual entry"? [Consistency, Spec §FR-011, Contracts §extract] → Already consistent; FR-011 now explicitly describes both cases including 422 → empty review form.
- [X] CHK015 — Is FR-012's draft-status default consistent with the data model's `DEFAULT 'published'` for existing recipes and `DEFAULT 'draft'` for new imports — and is this distinction explicit in requirements? [Consistency, Spec §FR-012, data-model.md] → Added assumption clarifying that DEFAULT 'published' is for backward compatibility only; import path always supplies status: 'draft' explicitly.
- [X] CHK016 — Are the requirements for what the user can edit (FR-006: title, ingredients, instructions) consistent with the ImportDraft type which also includes an `uncategorized` field? Is editing of uncategorized content in scope? [Consistency, Spec §FR-006] → Extended FR-006: uncategorized content is display-only; users may copy from it manually but cannot edit it in place.

---

## Acceptance Criteria Quality

- [X] CHK017 — Can SC-002's 80% accuracy target be objectively measured before release? Is a test dataset or measurement methodology defined? [Measurability, Spec §SC-002] → Already resolved: SC-002 labeled as post-launch benchmark, not a sprint gate.
- [X] CHK018 — Is SC-001's 15-second target broken down by stage (upload, pdf-parse, Claude API call, response) to make it actionable for investigation when the target is missed? [Clarity, Spec §SC-001] → Out of scope for v1: target is testable end-to-end as written (submit → review screen); per-stage breakdown is an observability concern, not a requirements gap.
- [X] CHK019 — Is SC-004's "clear explanation" requirement measurable — what qualifies as a sufficient explanation when an import cannot be completed? [Measurability, Spec §SC-004] → Updated SC-004: "clear explanation" = non-empty user-visible error message (not blank screen/browser error); exact wording defined in contracts/api.md.

---

## Scenario Coverage

- [X] CHK020 — Are requirements defined for cancellation during active extraction (while the loading indicator is shown, before the review screen appears)? [Gap, Coverage] → Added assumption: no in-flight cancel in v1; user must wait or close the tab; no DB record created if tab is closed.
- [X] CHK021 — Are requirements specified for the recovery path when extraction succeeds but the save step fails (user has reviewed but the DB write errors)? [Gap, Exception Flow] → Added FR-013: on save failure, keep user on review screen with error message displayed; allow retry without re-uploading.
- [X] CHK022 — Is the scenario covered where the user clears the pre-populated title on the review screen and attempts to save with an empty title? [Coverage, Spec §Assumptions] → Added FR-014: review screen must prevent confirmation when title is empty; inline validation message shown before request is sent.
- [X] CHK023 — Are requirements defined for saving a recipe with zero ingredients or zero instructions (user removed all items during review)? Is this allowed? [Coverage, Gap] → Already handled: contracts/api.md explicitly states ingredients and instructions may be empty arrays; empty saves are allowed.

---

## Edge Case Coverage

- [X] CHK024 — Is the multi-page PDF edge case resolved with a defined requirement? Currently listed as open with no FR assigned. [Gap, Spec §Edge Cases] → Added assumption: multi-page PDFs handled transparently by pdf-parse; all text concatenated; no special requirement needed.
- [X] CHK025 — Is the non-English PDF edge case resolved with a defined requirement or explicit out-of-scope statement? [Gap, Spec §Edge Cases] → Added assumption: non-English PDFs explicitly out of scope in v1; results undefined and untested.
- [X] CHK026 — Are requirements defined for timeout behavior when extraction exceeds the 15-second target? (e.g., cancel the request, show an error, allow retry) [Gap, Spec §SC-001] → Added assumption: timeout enforced by platform (Vercel limits); client shows generic retry error; no app-level timeout in v1.
- [X] CHK027 — Are atomicity requirements specified for the three-table write operation? Is partial failure (recipe saved, ingredient_entries fail) defined and handled? [Gap, data-model.md] → Added FR-015: three-table write must be atomic via Postgres RPC function; partial writes rolled back. Updated T003 (migration adds RPC) and T009 (save route calls RPC). RPC function signature added to data-model.md.
- [X] CHK028 — Are requirements defined for UID generation failure when the recipe title produces an empty or invalid slug? [Gap, data-model.md §UID Generation] → Added assumption and updated data-model.md UID rules (step 2): empty slug falls back to "recipe" base with -2/-3 collision suffixes. T009 updated accordingly.

---

## Security & Auth Requirements

- [X] CHK029 — Is the dev-mode auth bypass formally specified as a requirement (not just described in plan assumptions)? Are its exact preconditions documented in the spec? [Gap, Spec §FR-001] → Already covered: FR-001 formally states the authentication rule including development mode bypass.
- [X] CHK030 — Are security constraints on the service role key documented in requirements — specifically that it must never be used in production paths? [Gap] → Added FR-016: service role key restricted to Route Handlers where process.env.NODE_ENV === 'development'; must not appear in production paths or client code.
- [X] CHK031 — Are requirements defined to prevent a forged or replayed POST /api/import/save request that was not preceded by a valid extraction step? [Gap, Coverage] → Acceptable by design: in production, auth guard rejects unauthenticated requests; save endpoint validates inputs independently; no extract-to-save token needed in v1 (stateless API).

---

## Non-Functional Requirements

- [X] CHK032 — Are accessibility requirements specified for the PDF upload form? (e.g., keyboard operability, screen reader labels, ARIA roles) [Gap] → Added FR-017: upload form must be keyboard-operable with visible label and ARIA description for file types and size limit.
- [X] CHK033 — Are accessibility requirements specified for the loading indicator shown during extraction? (e.g., ARIA live region, focus management) [Gap] → Added FR-018: loading indicator must use role="status" ARIA live region for screen reader announcements.
- [X] CHK034 — Are mobile or responsive layout requirements defined for the review screen — or is desktop-only explicitly accepted? [Gap] → Added FR-019: upload form and review screen must be usable on mobile viewports; layout must be responsive.
- [X] CHK035 — Are rate limiting or request throttling requirements specified for the extract endpoint to guard against large-file abuse? [Gap] → Out of scope in v1: single-user app; Vercel platform limits are sufficient. Added assumption.
- [X] CHK036 — Are logging or observability requirements specified for extraction failures? (e.g., what is logged when Claude returns an error or pdf-parse throws) [Gap] → Added FR-020: extraction failures must be logged via console.error with error message and filename for Vercel log debugging.

---

## Dependencies & Assumptions

- [X] CHK037 — Is the assumption that the Claude API is always available addressed? Are requirements defined for degraded behavior when the Claude API is rate-limited or unreachable? [Assumption, Gap] → Added assumption: Claude API errors treated as transient extraction failure → 500 response; client shows retry message; no fallback in v1.
- [X] CHK038 — Is the one-PDF-one-recipe constraint formally elevated from an assumption to a functional requirement with a defined user-facing message when the constraint is encountered? [Traceability, Spec §Assumptions] → Acceptable as assumption: UI accepts one file at a time and enforces this naturally; no additional FR or user-facing message required.
- [X] CHK039 — Are the two new environment variables (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) documented as deployment requirements in the spec or quickstart? [Completeness, Spec §Assumptions] → Already covered: both variables documented in quickstart.md and tasks T002 (.env.example update).
- [X] CHK040 — Is the no-OCR constraint formally stated as a functional limitation to users — not just as an internal implementation decision? [Completeness, Spec §Assumptions] → Updated no-OCR assumption: clarified that the 422 "no text extracted" message (FR-011) is the user-facing communication of the limitation; no separate UI notice required.

---

## Notes

- Check items off as completed: `[x]`
- Add inline notes when an item reveals a gap that needs a spec update
- Items marked `[Gap]` represent missing requirements — each should result in either a new FR or an explicit out-of-scope decision recorded in the spec
- Items marked `[Ambiguity]` represent written requirements that need clarification before they can be implemented unambiguously
