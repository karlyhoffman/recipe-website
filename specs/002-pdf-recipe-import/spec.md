# Feature Specification: PDF Recipe Import

**Feature Branch**: `specs/002-pdf-recipe-import`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "add functionality to upload PDF files (recipes), scan text contents (ingredients and instructions), and create new recipe entries in the database with the content from the PDF"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload and Import a Recipe PDF (Priority: P1)

A user wants to add a recipe they have saved as a PDF. They upload the PDF through the app, the system reads the file and identifies the recipe's ingredients and instructions, and then creates a new recipe entry in the database.

**Why this priority**: This is the core user journey and delivers the primary value of the feature. All other stories depend on this working.

**Independent Test**: Can be fully tested by uploading a well-formatted recipe PDF and confirming a new recipe record appears in the database with correct ingredients and instructions.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, or the application is in development mode, **When** they upload a PDF file containing a recipe, **Then** the system extracts the recipe title, ingredients, and instructions from the file and presents them for review.
2. **Given** extracted content is displayed for review, **When** the user confirms the import, **Then** a new recipe entry is created in the database containing the extracted title, ingredients, and instructions.
3. **Given** a user attempts to upload a non-PDF file (e.g., `.docx`, `.jpg`), **When** they submit it, **Then** the system rejects the file and displays a clear error message explaining that only PDF files are accepted.
4. **Given** an unauthenticated user accesses the import feature outside of development mode, **When** they attempt to upload a PDF, **Then** the system prevents the action and prompts them to log in.

---

### User Story 2 - Review and Edit Extracted Content Before Saving (Priority: P2)

Before the recipe is saved, the user sees the extracted ingredients and instructions and can correct any errors introduced by the extraction process — for example, fixing a garbled ingredient or reordering a step.

**Why this priority**: PDF text extraction is imperfect. Allowing review prevents low-quality data from entering the database without user knowledge.

**Independent Test**: Can be fully tested by uploading a PDF, editing at least one ingredient and one instruction step in the review screen, confirming, and verifying the saved record reflects the edits.

**Acceptance Scenarios**:

1. **Given** the system has extracted content from a PDF, **When** the review screen is displayed, **Then** the user can edit the recipe title, any ingredient, and any instruction step before saving.
2. **Given** a user is reviewing extracted content, **When** they cancel the import, **Then** no recipe record is created and the user is returned to their previous state.
3. **Given** a user is reviewing extracted content, **When** they remove an ingredient or instruction step, **Then** the saved record excludes the removed item.

---

### User Story 3 - Handle Unreadable or Ambiguous PDFs (Priority: P3)

A user uploads a PDF that is scanned from paper (image-based) or has formatting the system cannot reliably parse. The system alerts the user that extraction was incomplete or failed, and gives them the option to manually enter the missing content.

**Why this priority**: Graceful degradation prevents user frustration when the extraction cannot fully complete. The user still achieves their goal of creating a recipe entry.

**Independent Test**: Can be fully tested by uploading an image-only or minimally-structured PDF and confirming the system shows an appropriate warning rather than silently saving empty or garbled fields.

**Acceptance Scenarios**:

1. **Given** a PDF with no extractable text (e.g., a scanned image), **When** the user uploads it, **Then** the system displays a message explaining that text could not be extracted, and presents an empty review form for manual entry.
2. **Given** a PDF where ingredients or instructions could not be confidently identified, **When** the review screen is displayed, **Then** empty ingredient or instruction sections show a visible warning banner prompting the user to fill them in, and any text the system could not classify appears in a labeled "Uncategorized Content" section for manual placement.

---

### Edge Cases

- What happens when an unauthenticated user tries to import outside of development mode?
- What happens when a PDF file exceeds the maximum allowed size?
- How does the system handle a multi-page PDF where recipe content spans multiple pages?
- What if a PDF contains content in a language other than English?
- How does the system handle a PDF that appears to contain multiple recipes?
- What if the extracted recipe title is empty or not found?
- What happens if the same PDF is uploaded more than once? (Resolved: always creates a new recipe — no deduplication.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow PDF import only when the user is authenticated, or when the application is running in development mode. Unauthenticated users in non-development environments MUST be prevented from importing.
- **FR-002**: System MUST extract plain text content from uploaded PDF files.
- **FR-003**: System MUST identify and separate ingredients from instructions within the extracted text.
- **FR-004**: System MUST attempt to extract a recipe title from the PDF content.
- **FR-005**: System MUST present all extracted content (title, ingredients, instructions) to the user for review before saving.
- **FR-006**: Users MUST be able to edit the title, ingredients, and instructions on the review screen before confirming. Users MAY also add new ingredient or instruction items that were not present in the original PDF. Uncategorized content is displayed in a labeled "Uncategorized Content" section below the instructions list, for reference only; users cannot edit it in place but may manually copy it into the ingredients or instructions fields.
- **FR-007**: Users MUST be able to cancel the import from the review screen without creating a database record.
- **FR-008**: System MUST create a new recipe entry in the database when the user confirms the import.
- **FR-009**: System MUST reject non-PDF file uploads and display a clear, user-friendly error message.
- **FR-010**: System MUST enforce a maximum PDF file size and inform the user if the file exceeds it.
- **FR-011**: System MUST display a clear message when text extraction fails or produces insufficient content, and allow the user to proceed with manual entry. Two distinct cases apply: (1) *No extractable text* — `pdf-parse` returns an empty or whitespace-only string; the server responds 422 and the client renders the review screen with empty fields. (2) *Insufficient structure* — text was extracted but Claude returned empty ingredient or instruction arrays; the server responds 200 and the review screen shows visible warning banners on the empty sections.
- **FR-012**: Newly imported recipes MUST be saved in draft status and flagged as PDF-imported. They MUST NOT be publicly visible until the user explicitly publishes them. Draft recipes MUST NOT appear in recipe listings or any public-facing surface.
- **FR-013**: If the save request fails, the system MUST display the error message above the review form and keep the user on the review screen so they can retry without re-uploading the PDF.
- **FR-014**: The review screen MUST prevent the user from submitting a confirmation when the title field is empty, displaying an inline validation message before any request is sent.
- **FR-015**: The three INSERT operations performed on save (recipes, ingredient_entries, instruction_entries) MUST be atomic. If any INSERT fails, all prior INSERTs in the same save operation MUST be rolled back. This will be implemented via a Postgres RPC function called from the save route.
- **FR-016**: The Supabase service role key MUST only be used within Route Handlers when `process.env.NODE_ENV === 'development'`. It MUST NOT be used in any production code path and MUST NOT be exposed to the client.
- **FR-017**: The PDF upload form MUST be fully keyboard-operable. The file input MUST have an associated visible label and an ARIA description indicating accepted file types and the size limit.
- **FR-018**: The loading indicator shown during extraction MUST use an ARIA live region (`role="status"`) so screen readers announce when extraction is in progress.
- **FR-019**: The upload form and review screen MUST be usable on mobile viewports. Layout MUST be responsive.
- **FR-020**: Extraction failures (pdf-parse errors, Claude API errors) MUST be logged server-side via `console.error` with sufficient context (error message, filename) for debugging in Vercel log output.

### Key Entities

- **Recipe**: Represents a single recipe. Key attributes include title, ingredients (structured list), instructions (ordered steps), import source (PDF filename), and status (draft/published). Recipes created via PDF import begin in draft status. Created by a specific user.
- **PDF Upload**: A transient artifact representing the file submitted by the user. Not persisted to the database; deleted immediately after text extraction completes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload a PDF and reach the review screen in under 15 seconds for files up to 10 MB. The upload and extraction process is synchronous; a loading indicator is shown while the user waits.
- **SC-002**: For well-structured recipe PDFs, the system correctly identifies ingredients and instructions without manual correction in at least 80% of cases. *(Post-launch benchmark — measured qualitatively in v1; not a sprint gate.)*
- **SC-003**: Users can complete the full import workflow — from file selection through review to redirect at `/recipes/{uid}` — in under 5 minutes.
- **SC-004**: 100% of import attempts either result in a new recipe record or a clear explanation of why the import could not be completed. A "clear explanation" means a non-empty, user-visible error message is displayed — not a blank screen or generic browser error. The exact error text for each failure case is defined in contracts/api.md.
- **SC-005**: Invalid file types are rejected immediately with no delay or ambiguity.

## Clarifications

### Session 2026-05-29

- Q: What happens to the uploaded PDF file after text extraction completes? → A: Deleted immediately after extraction completes.
- Q: What status should a recipe have immediately after a successful PDF import? → A: Draft — requires the user to manually publish after import.
- Q: What determines whether the environment is "local" for unauthenticated import access? → A: Development mode — specifically `process.env.NODE_ENV === 'development'`, which Next.js sets automatically when running `next dev`. Staging or preview environments running with `NODE_ENV=production` are treated as production and require authentication.
- Q: What should happen if the same PDF or an identical recipe title is imported more than once? → A: Always create a new recipe — no deduplication.
- Q: Should PDF extraction be synchronous (user waits) or asynchronous (user notified later)? → A: Synchronous — user waits on the page with a loading indicator.

## Assumptions

- PDF import is permitted for authenticated users in any environment, and for unauthenticated users only when the application is in development mode. Unauthenticated access in non-development environments is not supported.
- One PDF upload corresponds to one recipe. Multi-recipe PDFs are out of scope; the user is expected to upload one PDF per recipe.
- PDFs are expected to be text-based (digitally created). Image-only PDFs (scanned documents) will be handled gracefully with a fallback to manual entry, but OCR (optical character recognition) is out of scope. The 422 "no text could be extracted" message (FR-011) is the user-facing communication of this limitation; no separate UI notice is required.
- The review step is mandatory before saving; auto-saving without user confirmation is not supported.
- Extracted content that cannot be confidently categorized as either ingredients or instructions will be surfaced to the user as uncategorized text for manual placement.
- The recipe title will be pre-populated from extracted text if available; if not found, the user must provide one before confirming.
- Existing recipe fields on the platform (title, ingredients, instructions) define the scope of what is imported. Other recipe metadata (prep time, servings, nutritional info) is out of scope for extraction in this version.
- The maximum supported PDF file size is 10 MB (determined during planning based on storage and processing constraints).
- Classification of extracted text into ingredients, instructions, and uncategorized content is fully delegated to the Claude LLM. No rule-based criteria are defined; the model's structured JSON output is treated as authoritative. "Confident identification" in FR-003 means the model returned a parseable response with non-null content; SC-002 is the only quality benchmark and is measured post-launch.
- After a successful import confirmation, the user is redirected to the recipe detail page at `/recipes/{uid}`.
- Closing the browser during the review step discards the extracted content without creating a database record. No data loss occurs as nothing is persisted before the user confirms.
- The database migration adds `DEFAULT 'published'` to the `status` column for backward compatibility with existing recipe rows. This does not conflict with FR-012: the import save path always supplies `status: 'draft'` explicitly; the column default only applies when status is omitted, which the import flow never does.
- Cancellation during active extraction (while the loading indicator is shown) is not supported in v1. The user must wait for extraction to complete or close the tab. Closing the tab during extraction leaves no database record.
- Multi-page PDFs are handled transparently: pdf-parse concatenates all pages into a single text string passed to Claude as-is. Page count has no effect on the import flow.
- Non-English PDFs are out of scope in v1. Extraction results for non-English content are undefined and untested; users should upload English-language PDFs.
- Extraction timeout is enforced by the deployment platform (Vercel function execution limits). If a timeout occurs, the client receives a network error and displays a generic retry message. No application-level timeout is implemented in v1.
- If slugifying the recipe title produces an empty string or only hyphens (e.g., the title contains only special characters), the slug falls back to `"recipe"` as the base, with `-2`/`-3` collision suffixes applied as normal.
- Application-level rate limiting on the extract endpoint is out of scope in v1. The app is single-user; Vercel's platform-level request limits are sufficient.
- Claude API unavailability (rate limits, network errors) is treated as a transient extraction failure. The server returns 500 and the client displays the error message. No retry logic or fallback extraction method is implemented in v1.
