# Requirements Quality Checklist: Admin Authentication & Session Management

**Purpose**: Author self-review across all requirement domains — validate clarity, completeness, and consistency before `/speckit-plan`
**Created**: 2026-05-31
**Feature**: [spec.md](../spec.md)
**Depth**: Standard (~27 items) | **Audience**: Author | **Domains**: Security, Session, UX/Form, Accessibility, Gated Routes, Edge Cases

## Security Requirements Quality

- [ ] CHK001 - Is the JWT signing algorithm (e.g., HS256, RS256) specified, or left entirely to implementation? [Clarity, Spec §Key Entities]
- [ ] CHK002 - Are the specific environment variable names for admin credentials, password hash, and JWT secret documented? [Completeness, Gap]
- [ ] CHK003 - Is the rate limiting window type specified — sliding window vs fixed window? [Clarity, Spec §FR-013]
- [ ] CHK004 - Are requirements defined for what the rate-limit error message must communicate to the user? [Completeness, Spec §FR-013]
- [ ] CHK005 - Is the rate limiting scope defined — per IP only, or also per username? [Clarity, Spec §FR-013]
- [ ] CHK006 - Are HTTPS and the JWT cookie `Secure` flag requirements explicitly documented? [Gap]
- [ ] CHK007 - Are requirements defined to prevent open-redirect attacks on the post-login `returnUrl` parameter? [Security, Gap]

## Session Management Requirements Quality

- [ ] CHK008 - Is "inactivity" precisely defined — does the 24-hour clock reset on any server request, or only on explicit user actions? [Clarity, Spec §FR-009]
- [ ] CHK009 - Are requirements defined for whether and how the session expiry window resets while the admin is actively using the application? [Completeness, Gap]
- [ ] CHK010 - Does the spec acknowledge that stateless JWT logout cannot server-side invalidate a token, and does it define expected behavior (cookie deletion only)? [Clarity, Spec §FR-010]
- [ ] CHK011 - Are requirements defined for behavior when the JWT signing secret is rotated (e.g., all existing sessions are immediately invalidated)? [Edge Case, Gap]
- [ ] CHK012 - Is the `SameSite` attribute requirement for the session cookie specified? [Security, Gap]

## UX & Form Requirements Quality

- [ ] CHK013 - Is the default gated landing page (used when no `returnUrl` is recorded) explicitly identified by route? [Clarity, Spec §FR-004]
- [ ] CHK014 - Are requirements defined for the specific copy or content constraints on login error messages (e.g., generic single message vs field-level specificity)? [Clarity, Spec §FR-003]
- [ ] CHK015 - Are loading/pending state requirements defined for the login form during an in-flight submission? [Completeness, Gap]
- [ ] CHK016 - Is the placement or location of the logout control in the UI specified (e.g., navigation bar, header)? [Clarity, Spec §FR-010]
- [ ] CHK017 - Is the session-expired notification message copy specified, or is content left entirely to implementation? [Clarity, Spec §FR-009]
- [ ] CHK018 - Are requirements defined for login page behavior when JavaScript is disabled or unavailable? [Edge Case, Gap]

## Accessibility Requirements Quality

- [ ] CHK019 - Are WCAG 2.1 AA requirements quantified beyond the general statement — e.g., specific contrast ratios, focus indicator visibility criteria? [Clarity, Spec §FR-012]
- [ ] CHK020 - Are screen reader requirements specified for inline validation errors and form-level error messages (e.g., ARIA live regions, `aria-describedby`)? [Completeness, Spec §FR-012]
- [ ] CHK021 - Are focus management requirements defined for post-submission error display (e.g., focus moves to the first error on submit)? [Completeness, Spec §FR-012]

## Gated Route Requirements Quality

- [ ] CHK022 - Is the complete list of currently gated routes enumerated, or is scope implied as "import page + unspecified future pages"? [Completeness, Spec §Assumptions]
- [ ] CHK023 - Are requirements consistent between the nav-hiding mechanism (FR-006) and the redirect mechanism (FR-005) — i.e., both triggered by the same auth check? [Consistency, Spec §FR-005, §FR-006]
- [ ] CHK024 - Are requirements defined for how new gated routes are registered in the future — via configuration, code convention, or a defined pattern? [Completeness, Gap]

## Edge Case & Scenario Coverage

- [ ] CHK025 - Are requirements defined for concurrent sessions — is the admin permitted to be authenticated from two browsers simultaneously? [Coverage, Gap]
- [ ] CHK026 - Are requirements specified for application startup behavior when required environment variables (credentials, JWT secret) are absent or malformed? [Edge Case, Gap]
- [ ] CHK027 - Are requirements defined for whether a network-error login attempt counts toward the rate limit lockout threshold? [Edge Case, Spec §FR-013]

## Notes

- Add comments or findings inline as items are reviewed
- Mark items resolved: `[x]`
- Items marked `[Gap]` indicate requirements not currently in spec.md — decide whether to add or explicitly exclude before planning
