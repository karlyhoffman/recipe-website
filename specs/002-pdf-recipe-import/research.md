# Research: PDF Recipe Import

## Decision Log

### PDF Text Extraction Library

**Decision**: `pdf-parse`
**Rationale**: Pure Node.js library for extracting raw text from digital PDFs. Minimal footprint, no native binaries or compilation step. Works as a Next.js Route Handler dependency without special Webpack configuration. Matches the spec's explicit scope (text-based PDFs; OCR out of scope).
**Alternatives considered**:
- `pdfjs-dist` — Mozilla PDF.js; larger bundle, designed for browser use, supports more layout-edge cases but adds complexity unjustified by the spec scope
- Client-side extraction — would expose API keys and the service role key in the browser; rejected on security grounds

---

### Recipe Structure Extraction (title / ingredients / instructions)

**Decision**: Anthropic Claude API (`@anthropic-ai/sdk`) using `claude-haiku-4-5`
**Rationale**: PDF raw text varies wildly in layout. LLM-based extraction reliably identifies recipe title, ingredient lists, and instruction sequences regardless of heading style, multi-column layout, or non-standard formatting. `claude-haiku-4-5` is fast and cost-efficient for this synchronous flow. Structured JSON output maps directly to the `IngredientSlice[]` and `InstructionSlice[]` types already used across the app.
**Alternatives considered**:
- Regex / heuristic pattern matching — brittle; fails on unusual PDF layouts; unlikely to meet the SC-002 80% accuracy target
- Other LLM providers — equivalent capability but Anthropic is the project's existing AI tooling context

---

### Auth Strategy

**Decision**: Supabase Auth session-cookie detection in Route Handlers; service role key for dev-mode bypass
**Rationale**: `@supabase/ssr` is already installed. Supabase Auth handles session cookies natively. For the dev-mode bypass (`NODE_ENV === 'development'`), using `SUPABASE_SERVICE_ROLE_KEY` in the Route Handler sidesteps RLS without relaxing production policies. For authenticated users, passing their session JWT to a Supabase client enforces the INSERT RLS policies added by the migration.
**Alternatives considered**:
- Custom JWT middleware — unnecessary complexity; Supabase already provides session management
- Disable RLS for write tables — security risk; rejected per constitution Principle 3 (Data Integrity)

---

### File Upload Handling

**Decision**: Native Next.js Route Handler `request.formData()` with the Web `File` API
**Rationale**: App Router Route Handlers natively parse `multipart/form-data` via `request.formData()`. No additional middleware is needed. File size and type validation happen synchronously by inspecting `file.type` and `file.size` before any processing.
**Alternatives considered**:
- `multer` — Express middleware pattern; does not integrate cleanly with App Router Route Handlers
- `formidable` — adds a dependency for something the platform already handles

---

### Database Write Strategy

**Decision**: Two-client approach — authenticated Supabase client (user JWT) for production writes; service role client for dev-mode writes
**Rationale**: The existing schema has only `SELECT` RLS policies. Adding `INSERT` policies for the `authenticated` role allows standard session-based writes. In dev mode, the service role client bypasses RLS entirely, enabling unauthenticated writes without weakening production policies.
**Alternatives considered**:
- Single service role client for all writes — removes auth context; forfeits the ability to add per-user ownership later
- Removing RLS from write tables — violates constitution Principle 3

---

### UID / Slug Generation

**Decision**: Slugify title on the server (lowercase, replace spaces with hyphens, strip non-alphanumeric), then append `-2`, `-3`, etc. on collision
**Rationale**: The `recipes.uid` column has a `NOT NULL UNIQUE` constraint. A server-side uniqueness check (SELECT before INSERT) with collision suffix is the simplest approach at the current data scale.
**Alternatives considered**:
- UUID as uid — breaks URL readability and the pattern used by existing recipes
- Client-generated slug — puts uniqueness logic in the browser; rejected
