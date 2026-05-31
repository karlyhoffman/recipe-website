# API Contracts: PDF Recipe Import

## POST /api/import/extract

Accepts a PDF file upload, extracts raw text, runs Claude API extraction, and returns a structured draft for user review. The uploaded file is discarded after extraction completes.

### Request

```
Content-Type: multipart/form-data

file: <PDF file, max 10 MB>
```

### Responses

**200 OK** — Extraction succeeded (full or partial)

```json
{
  "title": "Lemon Herb Chicken",
  "ingredients": [
    { "type": "ingredient", "name": "chicken breast", "amount": "2", "preparation": "boneless" },
    { "type": "ingredient", "name": "lemon juice", "amount": "2 tbsp" }
  ],
  "instructions": [
    { "type": "instruction", "text": "Preheat oven to 375°F." },
    { "type": "instruction", "text": "Season chicken and place in baking dish." }
  ],
  "uncategorized": [],
  "filename": "lemon-herb-chicken.pdf"
}
```

> `title` may be `null` if not found in the PDF. `uncategorized` contains any text blocks the model could not classify as ingredients or instructions. `ingredients` and `instructions` may be empty arrays for PDFs with very little structure — the review screen allows manual entry in this case.

**400 Bad Request** — Invalid file type

```json
{ "error": "Only PDF files are accepted." }
```

**400 Bad Request** — File exceeds size limit

```json
{ "error": "File exceeds the 10 MB limit." }
```

**401 Unauthorized** — Unauthenticated request in non-development environment

```json
{ "error": "Authentication required to import recipes." }
```

**422 Unprocessable Entity** — PDF contains no extractable text (e.g., image-only/scanned)

```json
{ "error": "No text content could be extracted from this PDF. The review form has been left blank for manual entry." }
```

> A 422 response still allows the user to proceed — the client renders the review screen with empty fields.

**500 Internal Server Error**

```json
{ "error": "An error occurred during extraction. Please try again." }
```

---

## POST /api/import/save

Saves a user-confirmed import draft as a new recipe record. All three related tables (`recipes`, `ingredient_entries`, `instruction_entries`) are written atomically via the `import_recipe` RPC function (FR-015); if any insert fails the entire operation is rolled back. The recipe starts in `draft` status.

### Request

```
Content-Type: application/json

{
  "title": "Lemon Herb Chicken",
  "ingredients": [
    { "type": "ingredient", "name": "chicken breast", "amount": "2", "preparation": "boneless" }
  ],
  "instructions": [
    { "type": "instruction", "text": "Preheat oven to 375°F." }
  ],
  "import_source": "lemon-herb-chicken.pdf"
}
```

> `title` is required and must be a non-empty string. `ingredients` and `instructions` may be empty arrays (user may have cleared them during review). `import_source` is the original filename; may be an empty string if not available.

### Responses

**200 OK** — Recipe saved as draft

```json
{ "uid": "lemon-herb-chicken" }
```

> `uid` is the URL-safe slug generated from the title. The client redirects to `/recipes/{uid}`.

**400 Bad Request** — Missing or empty title

```json
{ "error": "A recipe title is required before saving." }
```

**401 Unauthorized**

```json
{ "error": "Authentication required to save recipes." }
```

**500 Internal Server Error**

```json
{ "error": "Failed to save recipe. Please try again." }
```
