# Requirements Quality Checklist: Admin Authentication & Session Management

**Purpose**: Author self-review across all requirement domains — validate clarity, completeness, and consistency before `/speckit-plan`
**Created**: 2026-05-31
**Feature**: [spec.md](../spec.md)
**Depth**: Standard (~27 items) | **Audience**: Author | **Domains**: Security, Session, UX/Form, Accessibility, Gated Routes, Edge Cases

## Security Requirements Quality

- [x] CHK001 - Is the JWT signing algorithm (e.g., HS256, RS256) specified, or left entirely to implementation? [Clarity, Spec §Key Entities]
  > HS256 (HMAC-SHA256, symmetric) specified in data-model.md.

- [x] CHK002 - Are the specific environment variable names for admin credentials, password hash, and JWT secret documented? [Completeness, Gap]
  > `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET` documented in data-model.md and quickstart.md.

- [x] CHK003 - Is the rate limiting window type specified — sliding window vs fixed window? [Clarity, Spec §FR-013]
  > Fixed window specified in data-model.md: resets when `now - windowStart >= WINDOW_MS`.

- [x] CHK004 - Are requirements defined for what the rate-limit error message must communicate to the user? [Completeness, Spec §FR-013]
  > Exact copy specified in contracts/api.md: "Too many failed login attempts. Please try again in 15 minutes."

- [x] CHK005 - Is the rate limiting scope defined — per IP only, or also per username? [Clarity, Spec §FR-013]
  > Per-IP only, keyed by `x-forwarded-for` first value; documented in data-model.md.

- [x] CHK006 - Are HTTPS and the JWT cookie `Secure` flag requirements explicitly documented? [Gap]
  > `Secure: true` in production, `false` in development (HTTP localhost); documented in data-model.md.

- [x] CHK007 - Are requirements defined to prevent open-redirect attacks on the post-login `returnUrl` parameter? [Security, Gap]
  > `returnUrl` must be `/`-prefixed, no `://`, no `//` prefix; invalid values fall back to `/import`. Documented in contracts/api.md and tasks T005.

## Session Management Requirements Quality

- [x] CHK008 - Is "inactivity" precisely defined — does the 24-hour clock reset on any server request, or only on explicit user actions? [Clarity, Spec §FR-009]
  > Resets on any authenticated request; proxy refreshes cookie expiry by 24h on every pass. Documented in contracts/api.md proxy behaviour table.

- [x] CHK009 - Are requirements defined for whether and how the session expiry window resets while the admin is actively using the application? [Completeness, Gap]
  > Covered by CHK008 — sliding window via proxy means any page navigation or API call extends the session.

- [x] CHK010 - Does the spec acknowledge that stateless JWT logout cannot server-side invalidate a token, and does it define expected behavior (cookie deletion only)? [Clarity, Spec §FR-010]
  > Accepted design: cookie deletion makes the token inaccessible; spec's "immediately invalidated" is accurate from the user's perspective. Token bytes remain valid until `exp` but cannot be presented without the cookie. Personal-site risk tolerance accepts this.

- [x] CHK011 - Are requirements defined for behavior when the JWT signing secret is rotated (e.g., all existing sessions are immediately invalidated)? [Edge Case, Gap]
  > Explicitly out of scope. Rotating `JWT_SECRET` causes `jose` to fail verification on all existing tokens — all sessions are immediately invalidated automatically. No additional requirement needed; this is the expected and desirable behavior.

- [x] CHK012 - Is the `SameSite` attribute requirement for the session cookie specified? [Security, Gap]
  > `SameSite: lax` specified in data-model.md — allows top-level navigations, blocks cross-site POSTs.

## UX & Form Requirements Quality

- [x] CHK013 - Is the default gated landing page (used when no `returnUrl` is recorded) explicitly identified by route? [Clarity, Spec §FR-004]
  > `/import` is the default; specified in spec.md Assumptions and contracts/api.md `redirectTo` field.

- [x] CHK014 - Are requirements defined for the specific copy or content constraints on login error messages (e.g., generic single message vs field-level specificity)? [Clarity, Spec §FR-003]
  > "Invalid username or password." specified in contracts/api.md. FR-003 requires no field-level specificity. Resolved.

- [x] CHK015 - Are loading/pending state requirements defined for the login form during an in-flight submission? [Completeness, Gap]
  > Gap resolved: T007 updated to require disabling the submit button and showing a loading state while the fetch is in-flight (prevents double-submit).

- [x] CHK016 - Is the placement or location of the logout control in the UI specified (e.g., navigation bar, header)? [Clarity, Spec §FR-010]
  > Navbar; tasks.md T014 specifies modifying `Navbar.tsx` to render the logout form.

- [x] CHK017 - Is the session-expired notification message copy specified, or is content left entirely to implementation? [Clarity, Spec §FR-009]
  > Exact copy specified in tasks.md T007: "Your session has expired. Please log in again."

- [x] CHK018 - Are requirements defined for login page behavior when JavaScript is disabled or unavailable? [Edge Case, Gap]
  > Explicitly out of scope. `LoginForm.tsx` is a Next.js Client Component requiring JS. This is a single-admin personal site; JS-disabled login is not a supported scenario.

## Accessibility Requirements Quality

- [x] CHK019 - Are WCAG 2.1 AA requirements quantified beyond the general statement — e.g., specific contrast ratios, focus indicator visibility criteria? [Clarity, Spec §FR-012]
  > "WCAG 2.1 AA" is a published standard with specific measurable criteria (contrast ratios, focus indicator requirements, etc.). The general statement is sufficient — it delegates to the standard rather than re-specifying it.

- [x] CHK020 - Are screen reader requirements specified for inline validation errors and form-level error messages (e.g., ARIA live regions, `aria-describedby`)? [Completeness, Spec §FR-012]
  > Gap resolved: T007 updated to require inline validation error elements to be associated with their input via `aria-describedby` (FR-012). Session-expiry message already had `role="alert"`.

- [x] CHK021 - Are focus management requirements defined for post-submission error display (e.g., focus moves to the first error on submit)? [Completeness, Spec §FR-012]
  > Specified in tasks.md T007: "focus moves to first error field on submit failure".

## Gated Route Requirements Quality

- [x] CHK022 - Is the complete list of currently gated routes enumerated, or is scope implied as "import page + unspecified future pages"? [Completeness, Spec §Assumptions]
  > `/import` and `/api/import/**` are the only current gated routes; spec.md Assumptions explicitly names this and notes "any future admin-only pages". Sufficient for current scope.

- [x] CHK023 - Are requirements consistent between the nav-hiding mechanism (FR-006) and the redirect mechanism (FR-005) — i.e., both triggered by the same auth check? [Consistency, Spec §FR-005, §FR-006]
  > Consistent: both derive from the same proxy auth check — `verifyToken` drives the redirect; the resulting `x-user-authenticated` header drives the nav. Single source of truth.

- [x] CHK024 - Are requirements defined for how new gated routes are registered in the future — via configuration, code convention, or a defined pattern? [Completeness, Gap]
  > Convention: add route patterns to the protected-routes list in `proxy.ts`. Single file, no configuration system needed for a personal site.

## Edge Case & Scenario Coverage

- [x] CHK025 - Are requirements defined for concurrent sessions — is the admin permitted to be authenticated from two browsers simultaneously? [Coverage, Gap]
  > Implicitly allowed by stateless JWT design (no server-side session store). Acceptable for a single-admin personal site; no requirement to prevent it.

- [x] CHK026 - Are requirements specified for application startup behavior when required environment variables (credentials, JWT secret) are absent or malformed? [Edge Case, Gap]
  > Missing env vars cause runtime failures (500 on login, startup error if JWT_SECRET is missing at `signToken` call time). Acceptable for a personal site where env vars are set once. No formal startup-validation requirement needed.

- [x] CHK027 - Are requirements defined for whether a network-error login attempt counts toward the rate limit lockout threshold? [Edge Case, Spec §FR-013]
  > Server errors (500, catch-all) do not increment the rate limit counter. The counter is only incremented on credential mismatch (401 path). This follows from the tasks T005 flow: `recordFailedAttempt` is called only in the credential-mismatch branch.

## Notes

- Add comments or findings inline as items are reviewed
- Mark items resolved: `[x]`
- Items marked `[Gap]` indicate requirements not currently in spec.md — decide whether to add or explicitly exclude before planning
- **Review completed 2026-05-31**: All 27 items resolved. Two gaps closed by updating tasks.md T007 (CHK015: loading state; CHK020: `aria-describedby`). Remaining gaps either resolved in planning artifacts (data-model.md, contracts/api.md, tasks.md) or explicitly scoped out for a single-admin personal site.
