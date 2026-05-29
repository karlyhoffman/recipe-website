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
2. **Given** a PDF where ingredients or instructions could not be confidently identified, **When** the review screen is displayed, **Then** any unidentified sections are marked as incomplete so the user knows to fill them in.

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
- **FR-006**: Users MUST be able to edit the title, ingredients, and instructions on the review screen before confirming.
- **FR-007**: Users MUST be able to cancel the import from the review screen without creating a database record.
- **FR-008**: System MUST create a new recipe entry in the database when the user confirms the import.
- **FR-009**: System MUST reject non-PDF file uploads and display a clear, user-friendly error message.
- **FR-010**: System MUST enforce a maximum PDF file size and inform the user if the file exceeds it.
- **FR-011**: System MUST display a clear message when text extraction fails or produces insufficient content, and allow the user to proceed with manual entry.
- **FR-012**: Newly imported recipes MUST be saved in draft status and flagged as PDF-imported. They MUST NOT be publicly visible until the user explicitly publishes them.

### Key Entities

- **Recipe**: Represents a single recipe. Key attributes include title, ingredients (structured list), instructions (ordered steps), import source (PDF filename), and status (draft/published). Recipes created via PDF import begin in draft status. Created by a specific user.
- **PDF Upload**: A transient artifact representing the file submitted by the user. Not persisted to the database; deleted immediately after text extraction completes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload a PDF and reach the review screen in under 15 seconds for files up to 10 MB. The upload and extraction process is synchronous; a loading indicator is shown while the user waits.
- **SC-002**: For well-structured recipe PDFs, the system correctly identifies ingredients and instructions without manual correction in at least 80% of cases.
- **SC-003**: Users can complete the full import workflow — upload, review, confirm — in under 3 minutes.
- **SC-004**: 100% of import attempts either result in a new recipe record or a clear explanation of why the import could not be completed.
- **SC-005**: Invalid file types are rejected immediately with no delay or ambiguity.

## Clarifications

### Session 2026-05-29

- Q: What happens to the uploaded PDF file after text extraction completes? → A: Deleted immediately after extraction completes.
- Q: What status should a recipe have immediately after a successful PDF import? → A: Draft — requires the user to manually publish after import.
- Q: What determines whether the environment is "local" for unauthenticated import access? → A: Development mode — the application's development/production environment flag (i.e. Next.js development mode).
- Q: What should happen if the same PDF or an identical recipe title is imported more than once? → A: Always create a new recipe — no deduplication.
- Q: Should PDF extraction be synchronous (user waits) or asynchronous (user notified later)? → A: Synchronous — user waits on the page with a loading indicator.

## Assumptions

- PDF import is permitted for authenticated users in any environment, and for unauthenticated users only when the application is in development mode. Unauthenticated access in non-development environments is not supported.
- One PDF upload corresponds to one recipe. Multi-recipe PDFs are out of scope; the user is expected to upload one PDF per recipe.
- PDFs are expected to be text-based (digitally created). Image-only PDFs (scanned documents) will be handled gracefully with a fallback to manual entry, but OCR (optical character recognition) is out of scope.
- The review step is mandatory before saving; auto-saving without user confirmation is not supported.
- Extracted content that cannot be confidently categorized as either ingredients or instructions will be surfaced to the user as uncategorized text for manual placement.
- The recipe title will be pre-populated from extracted text if available; if not found, the user must provide one before confirming.
- Existing recipe fields on the platform (title, ingredients, instructions) define the scope of what is imported. Other recipe metadata (prep time, servings, nutritional info) is out of scope for extraction in this version.
- The maximum supported PDF file size will be determined during planning based on storage and processing constraints.
