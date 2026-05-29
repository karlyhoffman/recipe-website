# Implementation Plan: PDF Recipe Import

**Branch**: `specs/002-pdf-recipe-import` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-pdf-recipe-import/spec.md`

## Summary

Allow users to upload a PDF recipe file; the server extracts the text using `pdf-parse`, identifies the title, ingredients, and instructions using the Anthropic Claude API, and returns a structured draft for in-browser review and editing. When the user confirms, a new `draft` recipe record is written to Supabase. In production, a valid Supabase Auth session is required; in `NODE_ENV=development`, writes bypass auth using the service role key.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.2.6 (App Router), React 19

**Primary Dependencies**:
- Existing: `@supabase/ssr`, `classnames`, Next.js, React
- New: `pdf-parse` (PDF text extraction), `@anthropic-ai/sdk` (recipe structure extraction)

**Storage**: Supabase (PostgreSQL) — `recipes`, `ingredient_entries`, `instruction_entries` tables. PDF files are never stored; discarded after in-memory extraction.

**Testing**: ESLint only (no test framework currently in the project)

**Target Platform**: Next.js App Router (Server Components + Route Handlers), Vercel deployment

**Performance Goals**: Extraction + review screen in under 15 seconds for PDFs up to 10 MB (SC-001)

**Constraints**: No OCR (text-based PDFs only). Synchronous processing (user waits with loading indicator). No multi-recipe PDFs (one file → one recipe).

**Scale/Scope**: Single-user recipe website; ~hundreds of recipes; no concurrency concerns

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| 1. User-Centered Content | ✅ Pass | Import flow expands recipe discovery and management. Draft status + mandatory review preserves content quality before publish. |
| 2. Maintainable Frontend Architecture | ✅ Pass | Two new components (`PdfImportForm`, `PdfImportReview`) + two new Route Handlers. Modular, composable. No changes to existing page logic. |
| 3. Data Integrity & Content Reliability | ✅ Pass | Schema migration preserves existing rows (default `status='published'`). Review step ensures user validates before DB write. PDF never stored. Service role key scoped to dev-mode only. |
| 4. Quality through Documentation & Review | ✅ Pass | Plan, contracts, data model, and quickstart documented here. PR must reference this plan. `.env.example` must be updated with new var names. |
| 5. Performance and Reliability | ✅ Pass | PDF processing runs in a Server Route Handler (not client bundle). `pdf-parse` and Claude API call are server-side only. Synchronous with visible loading state. |
| 6. Incremental Delivery | ✅ Pass | Deliverable in clear phases: DB migration → extraction pipeline → import UI. Each phase has verifiable output. |

**Justified deviations from defaults:**
- Two new external dependencies (`pdf-parse`, `@anthropic-ai/sdk`) are unavoidable — no built-in Next.js or browser API handles PDF parsing or AI-powered structure extraction. Must be noted in the PR description per constitution constraints.
- Two new environment variables (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) must be added to `.env.example`.

## Project Structure

### Documentation (this feature)

```text
specs/002-pdf-recipe-import/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 schema + type changes
├── quickstart.md        # Phase 1 setup guide
├── contracts/
│   └── api.md           # Phase 1 API contracts
└── tasks.md             # Phase 2 output (created by /speckit-tasks)
```

### Source Code Changes (in `supabase/`)

```text
supabase/
├── app/
│   ├── import/
│   │   └── page.tsx                   # Client component: upload + review flow
│   └── api/
│       ├── import/
│       │   ├── extract/
│       │   │   └── route.ts           # POST: receive PDF, extract, return draft
│       │   └── save/
│       │       └── route.ts           # POST: save confirmed draft to DB
│       └── (existing routes unchanged)
├── components/
│   ├── PdfImportForm.tsx              # File upload form (file input + submit)
│   └── PdfImportReview.tsx           # Editable review: title, ingredients, instructions
├── lib/
│   ├── pdf.ts                         # Thin wrapper around pdf-parse
│   ├── recipe-extractor.ts           # Anthropic Claude API call → ImportDraft
│   └── supabase.ts                   # Extend: add auth-aware client + service role client
├── types/
│   └── index.ts                       # Add ImportDraft; add status/import_source to Recipe
└── supabase/
    └── migrations/
        └── 0002_pdf_import.sql        # status, import_source columns + INSERT/UPDATE policies
```

**Structure Decision**: This feature extends the existing web application structure (Option 2 in template terms: `app/` for pages + API routes, `components/` for UI, `lib/` for data access). No new top-level directories are needed.

## Phase Artifacts

- **research.md** — [PDF library, auth strategy, UID generation, and other key decisions](./research.md)
- **data-model.md** — [Schema migration, TypeScript type additions, entity lifecycle](./data-model.md)
- **contracts/api.md** — [POST /api/import/extract and POST /api/import/save contracts](./contracts/api.md)
- **quickstart.md** — [Env vars, dependencies, migration, and local test instructions](./quickstart.md)
