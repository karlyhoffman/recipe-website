# Feature Specification: Admin Authentication & Session Management

**Feature Branch**: `specs/003-admin-auth`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Update the existing user authentication to the application to add a login page and session management. The system will support exactly one admin account, so no signup or account‑creation flow is required. The admin must authenticate before accessing gated content, including the import page and its corresponding navigation link. Unauthenticated users must not see or access any gated content. The feature should include input validation, clear error messaging, accessibility‑compliant UI, and well‑defined UX flows for login, logout, and session expiration."

## Clarifications

### Session 2026-05-31

- Q: What session mechanism should be used to persist and validate the admin's authenticated state? → A: HTTP-only cookie with JWT (stateless, signed with a secret, no server store needed)
- Q: How should the admin password be stored in environment configuration? → A: Bcrypt or argon2 hash stored in env var; submitted password is hashed and compared at login
- Q: Should the login endpoint enforce rate limiting to protect against brute-force attacks? → A: Yes — simple server-side rate limiting: lock out an IP after N failed attempts within a time window
- Q: What should the login identifier be — email, username, or either? → A: Username only (arbitrary string, no email format requirement)
- Q: What should happen if the login request fails due to a network or server error? → A: Display a generic form-level error: "Something went wrong, please try again" (no retry logic)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Login (Priority: P1)

The admin navigates to the login page, enters their credentials, and gains access to gated areas of the application. On failure, they receive a clear error message and can try again.

**Why this priority**: Authentication is the gateway to all gated functionality. Without a working login, no other part of this feature can be tested or used.

**Independent Test**: Can be fully tested by visiting the login page, submitting valid credentials, and confirming access to the import page — and by submitting invalid credentials and confirming an error is shown.

**Acceptance Scenarios**:

1. **Given** the admin is not logged in, **When** they navigate to `/login`, **Then** they see a form with username and password fields plus a submit button
2. **Given** the admin is on the login page, **When** they submit valid credentials, **Then** they are redirected to the page they originally requested (or a default gated landing page if none)
3. **Given** the admin is on the login page, **When** they submit invalid credentials, **Then** they see a descriptive error message and the form remains on screen
4. **Given** the admin is on the login page, **When** they submit the form with one or both fields empty, **Then** they see inline validation errors identifying the missing fields before the form is submitted
5. **Given** the admin is already authenticated, **When** they navigate to `/login`, **Then** they are redirected away from the login page to a default gated landing page

---

### User Story 2 - Gated Content Protection (Priority: P2)

An unauthenticated visitor attempting to reach any gated page — or noticing the navigation — cannot access or see protected content. They are redirected to the login page with no way to bypass it.

**Why this priority**: Content protection is a core security requirement. The import page and its nav link must be invisible and inaccessible to unauthenticated users.

**Independent Test**: Can be fully tested by visiting a gated URL while unauthenticated and confirming a redirect to `/login`, and by inspecting the navigation to confirm no gated links are rendered.

**Acceptance Scenarios**:

1. **Given** a user is not authenticated, **When** they navigate directly to a gated page (e.g., the import page), **Then** they are immediately redirected to the login page
2. **Given** a user is not authenticated, **When** they view any page with navigation, **Then** no links to gated content (e.g., the import link) are visible in the navigation
3. **Given** a user is authenticated, **When** they view navigation, **Then** gated links (e.g., the import link) are visible and functional
4. **Given** a user is not authenticated, **When** they try to access a gated URL directly (e.g., via the browser address bar), **Then** they are redirected to the login page and cannot access the content

---

### User Story 3 - Session Persistence & Expiration (Priority: P3)

Once logged in, the admin's session persists across page refreshes and browser restarts within the session window. When the session expires due to inactivity, the admin is informed and directed back to the login page.

**Why this priority**: Without session persistence, the admin would have to log in on every page. Expiration ensures security over time.

**Independent Test**: Can be tested by logging in, refreshing the page, and confirming access is maintained — and by simulating session expiry and confirming the admin is redirected with a notification.

**Acceptance Scenarios**:

1. **Given** the admin is authenticated, **When** they refresh the browser, **Then** they remain authenticated and their session is preserved
2. **Given** the admin's session has expired due to inactivity, **When** they attempt to access any gated page, **Then** they are redirected to the login page with a notification that their session has expired
3. **Given** the admin's session has expired mid-session, **When** they are already on a gated page and attempt an action, **Then** they are redirected to the login page with a session-expired notification

---

### User Story 4 - Logout (Priority: P4)

The authenticated admin can log out at any time, immediately ending their session. After logout, they cannot access gated content without re-authenticating.

**Why this priority**: Logout is a fundamental security control, allowing the admin to explicitly end their session, particularly on shared devices.

**Independent Test**: Can be tested by clicking the logout control while authenticated and confirming the session ends, gated pages are inaccessible, and gated nav links are hidden.

**Acceptance Scenarios**:

1. **Given** the admin is authenticated, **When** they trigger the logout action, **Then** their session is immediately invalidated and they are redirected to the login page (or a public landing page)
2. **Given** the admin has just logged out, **When** they attempt to navigate back to a gated page (e.g., using the browser back button or direct URL), **Then** they are redirected to the login page
3. **Given** the admin is authenticated, **When** they view the interface, **Then** a logout control is visible and accessible

---

### Edge Cases

- What happens when the admin submits the login form with both fields empty?
- What happens when only one field is filled in on the login form?
- What happens when the admin's session expires while they are actively on a gated page?
- What happens when an unauthenticated user attempts to directly access a gated URL by typing it into the browser?
- What happens when the admin tries to navigate to the login page while already authenticated?
- What happens if there is a network or server error during the login request? A generic form-level error ("Something went wrong, please try again") is displayed; no automatic retry occurs.
- What happens when an IP exceeds the failed login attempt threshold? The login form displays a rate-limit error message and the IP is blocked from further attempts for the duration of the lockout window.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a publicly accessible login page with username and password input fields and a submit control
- **FR-002**: System MUST validate that all required fields are filled before processing a login submission, displaying inline error messages for any empty fields
- **FR-003**: System MUST display a clear, user-facing error message when submitted credentials do not match the admin account, without revealing which field was incorrect
- **FR-004**: System MUST grant access to gated content upon successful login and redirect the admin to their originally requested destination (or a default gated page if no destination was recorded)
- **FR-005**: System MUST block access to all gated pages for unauthenticated users and redirect them to the login page, preserving their intended destination for post-login redirect
- **FR-006**: System MUST hide all gated navigation links from unauthenticated users
- **FR-007**: System MUST show gated navigation links to authenticated users
- **FR-008**: System MUST persist the admin's authenticated session across page refreshes and browser sessions for the duration of the session window
- **FR-009**: System MUST automatically expire sessions after 24 hours of inactivity and redirect the user to the login page with a session-expired notification upon their next action
- **FR-010**: System MUST provide a logout control visible to authenticated users that immediately invalidates the session and redirects to the login page or a public landing page
- **FR-011**: System MUST redirect an already-authenticated admin away from the login page to a default gated landing page
- **FR-012**: Login form, error messages, and all interactive controls MUST meet WCAG 2.1 AA accessibility standards, including visible labels, keyboard navigability, and appropriate focus management
- **FR-013**: The login endpoint MUST enforce server-side rate limiting, blocking further attempts from an IP after 5 consecutive failed logins within a 15-minute window, and returning a user-facing error message when the limit is exceeded

### Key Entities

- **Admin Session**: Represents an authenticated period for the single admin account; implemented as a stateless JWT signed with a server secret, stored in an HTTP-only cookie; tracks authentication state and expiry time
- **Gated Route**: Any application page or navigation link that requires authentication to access or display

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The admin can complete the full login flow — from landing on the login page to accessing a gated page — in under 60 seconds
- **SC-002**: Zero unauthenticated users can reach any gated page or see gated navigation links under normal conditions
- **SC-003**: All login form fields, error messages, and controls are operable via keyboard alone and pass an automated accessibility audit with no critical violations
- **SC-004**: Login error messages are displayed within 1 second of submitting invalid credentials
- **SC-005**: Sessions are automatically invalidated after 24 hours of inactivity, verified by attempting access after simulated expiry
- **SC-006**: Logout completes immediately (within 1 second) and any subsequent attempt to reach a gated page results in a redirect to login, without re-authentication
- **SC-007**: The login page correctly handles empty-field submissions with visible inline validation without requiring a server round-trip

## Assumptions

- The single admin account's credentials are pre-configured via environment variables: the admin username as plaintext and the admin password as a bcrypt (or argon2) hash; no database-based user record or signup flow is needed
- Sessions are implemented as stateless JWTs stored in HTTP-only cookies, signed with a server-side secret configured via environment variable; session duration defaults to 24 hours of inactivity and is configurable without code changes
- After session expiry, the admin is shown a visible notification (e.g., "Your session has expired. Please log in again.") on the login page
- After successful login, the admin is redirected to the page they originally attempted to access; if no destination is recorded, they land on a default gated page (e.g., the import page)
- "Gated content" refers to the import page (spec 002: PDF recipe import) and any future admin-only pages; public-facing recipe pages remain accessible to all visitors
- The login page URL is `/login` and is publicly accessible
- A "forgot password" or account recovery flow is explicitly out of scope, as there is only one admin account managed via environment configuration
- Accessibility compliance target is WCAG 2.1 Level AA
- No multi-factor authentication (MFA) is required for this feature
