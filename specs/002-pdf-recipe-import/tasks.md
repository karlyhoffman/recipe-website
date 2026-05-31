# Tasks: PDF Recipe Import

**Input**: Design documents from `/specs/002-pdf-recipe-import/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/api.md ✓, quickstart.md ✓

**Tests**: ESLint only — no test framework in this project; no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths are relative to the repository root

---

## Phase 1: Setup

**Purpose**: Install new dependencies and update environment configuration

- [X] T001 Install pdf-parse, @anthropic-ai/sdk, and @types/pdf-parse from the supabase/ directory
- [X] T002 [P] Add ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY entries to supabase/.env.example

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema, TypeScript types, and Supabase client helpers — must complete before any user story work begins

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Create supabase/migrations/0002_pdf_import.sql — add status (text NOT NULL DEFAULT 'published' with check constraint) and import_source (text nullable) columns to recipes; add authenticated INSERT policies to recipes, ingredient_entries, and instruction_entries; add authenticated UPDATE policy scoped to draft recipes; add `import_recipe` RPC function performing an atomic INSERT into all three tables within a single transaction (FR-015); the RPC must accept and INSERT created_at explicitly for all three tables — none of the three tables have a default on that column; per data-model.md. Additionally, update supabase/lib/data.ts to add `.eq('status', 'published')` to all public browse and search queries: getAllRecipes, searchRecipes, getWeekdayRecipes, getRecentRecipes, getRandomRecipes. Do NOT filter getRecipeByUid — draft recipes must be accessible by direct URL for the post-import redirect (FR-012).
- [X] T004 [P] Add IngredientSlice, InstructionSlice, and ImportDraft interfaces (title, ingredients as IngredientSlice[], instructions as InstructionSlice[], uncategorized, filename) and add status and import_source fields to the Recipe interface in supabase/types/index.ts per data-model.md
- [X] T005 [P] Extend supabase/lib/supabase.ts with a session-cookie-aware client function for Route Handlers (production writes) and a service role client function using SUPABASE_SERVICE_ROLE_KEY (dev-mode writes); per research.md auth strategy

**Checkpoint**: Foundation ready — all three user stories can now be implemented

---

## Phase 3: User Story 1 — Upload and Import a Recipe PDF (Priority: P1) 🎯 MVP

**Goal**: User uploads a PDF; system extracts title, ingredients, and instructions via Claude; user sees a review screen; on confirm a draft recipe is saved to the database.

**Independent Test**: In development mode, upload a text-based recipe PDF at `/import`; confirm a new row appears in `recipes` with `status = 'draft'`, `import_source` set to the filename, and matching rows in `ingredient_entries` and `instruction_entries`.

- [X] T006 [US1] Implement supabase/lib/pdf.ts — export async `extractText(arrayBuffer: ArrayBuffer): Promise<string>` wrapping pdf-parse; return the extracted text string (empty string for image-only PDFs)
- [X] T007 [US1] Implement supabase/lib/recipe-extractor.ts — call claude-haiku-4-5-20251001 via @anthropic-ai/sdk with the raw text; prompt for JSON matching ImportDraft (title, ingredients as IngredientSlice[], instructions as InstructionSlice[], uncategorized as string[]); parse and return ImportDraft
- [X] T008 [US1] Implement supabase/app/api/import/extract/route.ts — POST handler: auth guard (401 in non-development environments), file type check (400 if not PDF), file size check (400 if > 10 MB), call extractText() then extractRecipe(), return ImportDraft as JSON 200; log extraction failures (pdf-parse errors, Claude API errors) via `console.error` with error message and filename (FR-020); per contracts/api.md
- [X] T009 [US1] Implement supabase/app/api/import/save/route.ts — POST handler: auth guard (401 in non-development environments), validate non-empty title (400), slugify title (fall back to "recipe" if slug is empty) and query recipes for uid conflicts with -2/-3 collision suffix, call `import_recipe` RPC to atomically INSERT into recipes, ingredient_entries, and instruction_entries (status: 'draft', import_source, created_at explicitly), return `{ uid }`; per contracts/api.md and data-model.md UID rules
- [X] T010 [P] [US1] Create supabase/components/PdfImportForm.tsx — controlled file input restricted to application/pdf; client-side type rejection with error message; client-side size rejection (> 10 MB) with error message before fetch; submit handler POSTs to /api/import/extract as multipart/form-data; include a visible `<label>`, an `aria-describedby` hint listing accepted file types and the 10 MB size limit, and ensure full keyboard operability (FR-017); shows loading indicator during upload rendered with `role="status"` so screen readers announce extraction progress (FR-018); layout MUST be responsive for mobile viewports (FR-019); calls onExtracted(draft: ImportDraft) on success and surfaces API error messages on failure
- [X] T011 [US1] Create supabase/components/PdfImportReview.tsx — render title, ingredients list, and instructions list from an ImportDraft prop; include Confirm button (calls onConfirm with current draft) and Cancel button (calls onCancel); layout MUST be responsive for mobile viewports (FR-019)
- [X] T012 [US1] Create supabase/app/import/page.tsx — client component managing state: idle → loading → review; render PdfImportForm when idle/loading; render PdfImportReview when draft is set; on confirm POST to /api/import/save and redirect to /recipes/{uid}; on save failure display the error message above the review form and remain in the review state so the user can retry without re-uploading (FR-013); on cancel reset to idle

**Checkpoint**: Full upload → extract → review → save pipeline works end-to-end in development mode

---

## Phase 4: User Story 2 — Review and Edit Extracted Content (Priority: P2)

**Goal**: On the review screen, the user can edit the recipe title, modify or delete any ingredient, and modify or delete any instruction step before saving.

**Independent Test**: Upload a PDF, edit at least one ingredient and one instruction on the review screen, delete one item from each list, confirm, and verify the saved recipe in the database reflects only the edited, non-deleted content.

- [X] T013 [US2] Extend supabase/components/PdfImportReview.tsx — replace title display with a controlled text input; replace each ingredient entry with an editable text input and a delete button; add an "Add ingredient" button that appends a new blank IngredientSlice to the list; replace each instruction entry with an editable textarea and a delete button; add an "Add step" button that appends a new blank InstructionSlice to the list; pass the mutated draft state to onConfirm so edits, additions, and deletions are included in the save request; disable the Confirm button and display an inline validation message when the title field is empty (FR-006, FR-014); do NOT add editing controls to the Uncategorized Content section — FR-006 requires it to be display-only (the section is introduced in T015)

**Checkpoint**: Review screen is fully editable; confirmed saves reflect all user edits and deletions

---

## Phase 5: User Story 3 — Handle Unreadable or Ambiguous PDFs (Priority: P3)

**Goal**: When a PDF yields no extractable text or ambiguous structure, the system shows a clear warning and lets the user manually enter content rather than silently failing.

**Independent Test**: Upload an image-only or near-empty PDF; confirm the review screen appears with a visible warning and empty/partial fields rather than a blank or error page; confirm the user can still type content and save.

- [X] T014 [US3] Update supabase/app/api/import/extract/route.ts — after extractText(), if the result is empty or whitespace-only, return 422 with `{ error: "No text content could be extracted from this PDF. The review form has been left blank for manual entry." }` per contracts/api.md
- [X] T015 [US3] Extend supabase/components/PdfImportReview.tsx — when ingredients or instructions are empty arrays, render a visible warning banner instructing the user to fill in that section manually; if uncategorized is non-empty, display those text blocks in a labeled "Uncategorized Content" section below instructions
- [X] T016 [US3] Update supabase/app/import/page.tsx — handle 422 response from /api/import/extract by transitioning to the review state with an empty ImportDraft (null title, empty arrays) and rendering the 422 error message above the review form

**Checkpoint**: Image-only and ambiguous PDFs are handled gracefully; user can always proceed to manual entry

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Lint compliance and end-to-end validation against the quickstart guide

- [X] T017 [P] Run ESLint on all new and modified files (supabase/lib/pdf.ts, supabase/lib/recipe-extractor.ts, supabase/lib/supabase.ts, supabase/app/api/import/extract/route.ts, supabase/app/api/import/save/route.ts, supabase/components/PdfImportForm.tsx, supabase/components/PdfImportReview.tsx, supabase/app/import/page.tsx, supabase/types/index.ts) and fix all violations
- [X] T018 [P] Run `npx tsc --noEmit` from supabase/ and fix all type errors (required by constitution before merge)
- [X] T019 [P] Update the app README with the new environment variables (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) and PDF import setup steps so developer onboarding reflects the new dependencies (constitution §4)
- [ ] T020 Follow the quickstart.md validation steps: apply migration via `supabase db push`, start `npm run dev` in supabase/, upload a recipe PDF at http://localhost:3000/import, verify redirect to /recipes/{uid}, confirm draft row in DB with correct status and import_source

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001 and T002 start immediately; T002 can run in parallel with T001
- **Foundational (Phase 2)**: Depends on Phase 1 — T003, T004, T005 can all run in parallel with each other; BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — T006 → T007 → T008 must be sequential; T009 and T010 can start in parallel after Phase 2; T011 can start after T004; T012 starts after T010 and T011
- **US2 (Phase 4)**: Depends on T011 from US1 — single task, starts after Phase 3
- **US3 (Phase 5)**: Depends on T008, T011, and T012 from US1 — T014, T015, T016 can run in parallel with each other; can also run in parallel with US2
- **Polish (Phase 6)**: Depends on all previous phases — T017, T018, T019 can run in parallel; T020 must run last

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no dependency on other stories
- **US2 (P2)**: Extends PdfImportReview (T011) — must wait for US1 to complete
- **US3 (P3)**: Extends extract route (T008), PdfImportReview (T011), and page.tsx (T012) — must wait for US1 to complete; can run in parallel with US2

### Within US1

- T006 before T007 (recipe-extractor imports from pdf.ts)
- T007 before T008 (extract route imports from recipe-extractor)
- T009, T010, T011 can start in parallel after Phase 2 completes (all different files)
- T012 after T010 and T011

---

## Parallel Example: User Story 1

```bash
# Sequential pipeline (must run in order):
Task T006: "Implement supabase/lib/pdf.ts"
Task T007: "Implement supabase/lib/recipe-extractor.ts"  # after T006
Task T008: "Implement supabase/app/api/import/extract/route.ts"  # after T007

# Meanwhile, run in parallel once Phase 2 is done:
Task T009: "Implement supabase/app/api/import/save/route.ts"
Task T010: "Create supabase/components/PdfImportForm.tsx"
Task T011: "Create supabase/components/PdfImportReview.tsx"

# Then:
Task T012: "Create supabase/app/import/page.tsx"  # after T010 and T011
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Upload a recipe PDF in dev mode, confirm draft recipe in DB
5. Merge or demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → schema, types, and client helpers ready
2. Add User Story 1 → full pipeline works end-to-end → MVP
3. Add User Story 2 → review screen editable → improved UX
4. Add User Story 3 → graceful degradation for bad PDFs → robust feature
5. Each story can be deployed independently without breaking prior stories

---

## Notes

- [P] tasks operate on different files with no incomplete-task dependencies
- [USn] label maps each task to a specific user story for traceability
- No test tasks — ESLint is the only automated quality tool in this project
- PDF files are never persisted; discard immediately after text extraction (research.md)
- Auth bypass in development mode uses `NODE_ENV === 'development'` check with service role key
- UID generation requires a SELECT before INSERT due to the `UNIQUE` constraint on `recipes.uid`
- The `created_at` column has no default — the INSERT must supply it explicitly (`new Date().toISOString()`)
