<!--
Sync Impact Report
Version change: none -> 1.0.0
Modified principles:
  - Added User-Centered Content
  - Added Maintainable Frontend Architecture
  - Added Data Integrity & Content Reliability
  - Added Quality through Documentation & Review
  - Added Incremental Delivery & Observability
Added sections:
  - Constraints & Technology
  - Development Workflow
Removed sections: none
Templates reviewed:
  - .specify/templates/plan-template.md ✅
  - .specify/templates/spec-template.md ✅
  - .specify/templates/tasks-template.md ✅
Follow-up TODOs: none
-->

# Recipe Website Constitution

## Core Principles

### 1. User-Centered Content
All decisions MUST prioritize recipe discovery, tag‑driven browsing, accessible navigation, and readable recipe presentation on desktop and mobile. Search, tag filters, and recipe detail views MUST remain functional even when content is incomplete or partially migrated.

### 2. Maintainable Frontend Architecture
The application MUST use modular React components, explicit data contracts, and minimal external dependencies. The codebase MUST follow Next.js and React conventions that keep UI components composable, reusable, and predictable. Changes MUST avoid monolithic page logic, preserve the existing Next.js, and keep styling aligned with the current stylesheet structure. Styling, layout, and data fetching MUST be organized to keep changes isolated and traceable.

### 3. Data Integrity & Content Reliability
CMS content is the source of truth for recipes, tags, and metadata; code MUST validate and safely handle missing or malformed entries. Any runtime content failure MUST degrade gracefully rather than expose raw errors to users.

### 4. Quality through Documentation & Review
All feature changes and content-type updates MUST be documented, reviewed in a pull request, and verified against the current README and local build workflow. Changes to pages, components, or integrations require at least one reviewer and a documented verification step.

### 5. Performance and Reliability
Public pages MUST load quickly on Vercel through appropriate use of static generation and server-side rendering. New work MUST avoid unnecessary bundle growth, excessive client-side dependencies, and untested cross-browser regressions.

### 6. Incremental Delivery & Observability
Work MUST be delivered in small, verifiable increments with clear success criteria. Build, test, and deployment outcomes MUST be observable through the repository’s existing tooling, and any production deployment MUST be accompanied by a rollback plan.

## Technology Stack

- **Framework**: Next.js 16 with App Router (React 19, TypeScript 5)
- **Styling**: SCSS/Sass modules
- **Database**: Supabase (PostgreSQL) — active migration from Prismic CMS and placeholder data
- **Deployment**: Vercel (preview per PR, production from `main`)
- **Linting**: ESLint via `eslint-config-next`

New dependencies MUST be justified in the PR description. Prefer built-in Next.js or browser APIs
over third-party packages for tasks they already support.

## Constraints & Technology
The project MUST remain a Next.js website. New frameworks or major architecture changes require explicit approval. Styling MUST continue through the established `styles/` and component-based stylesheet approach. Deployment intent is Vercel or equivalent static/edge hosting.

## Development Workflow
All work MUST occur in feature branches, with pull requests used for every change. PRs MUST include a description of what was changed, how it was tested locally, and whether the change impacts content types or page routing. PRs require a passing TypeScript + ESLint checks, Vercel preview link for UI changes. Documentation updates MUST accompany code changes that affect behavior or developer setup.

## Governance
This constitution is the authoritative guide for repository decisions and overrides informal conventions. This constitution supersedes informal habits or historical patterns. All `.specify` artifacts, templates, and plans MUST comply with this document.

Amendments require a PR updating this file with a version bump following semantic versioning, and a review of all SpecKit templates to propagate constitutional changes

Versioning follows semantic rules:
- MAJOR: Incompatible governance or principle changes.
- MINOR: New principle, additional constraints, or expanded mandatory processes.
- PATCH: Clarifications, wording fixes, or non-semantic refinements.

Compliance review expectation:
- Use `.specify/templates/plan-template.md` Constitution Check before design work.

- All pull requests MUST reference this constitution when they introduce new architecture, data handling, or review process changes.
- Complexity MUST be justified in the PR description when it deviates from the defined principles.

Use `README.md`, `.specify/templates/*`, and this constitution as the authoritative guidance for project workflow, quality decisions, and maintainability.

**Version**: 1.0.0 | **Ratified**: 2026-05-27 | **Last Amended**: 2026-05-27
