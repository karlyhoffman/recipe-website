# Feature Specification: Cheapest Grocery Store

**Feature Branch**: `specs/004-grocery-store-compare`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Add a 'Cheapest Grocery Store' section to the grocery page. This section will only appear for authenticated users and should display a list of stores sorted by total price for the given ingredients list. This feature should integrate with one or more (cost-effective) grocery pricing data sources (e.g. a third-party grocery API, scraped price data, or a manually maintained price database) to fetch current prices per store. The goal is to help users save money on their weekly grocery shop by making intelligent, data-driven store recommendations directly from the recipes they already use."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Store Price Ranking (Priority: P1)

The authenticated user visits the grocery page, which displays a shopping list assembled from one or more recipes. Below the ingredient list, a "Cheapest Grocery Store" section shows all covered stores ranked from lowest to highest total estimated basket price, so the user can immediately see which store will cost the least for the full shop.

**Why this priority**: This is the core value of the feature — a single glance tells the user where to shop. Everything else builds on this.

**Independent Test**: Log in, navigate to the grocery page with at least one ingredient in the list, and verify the section appears with stores ranked by total price.

**Acceptance Scenarios**:

1. **Given** the user is authenticated and the grocery page has a non-empty ingredient list, **When** the page loads, **Then** the Cheapest Grocery Store section is visible and lists at least two stores ranked from cheapest to most expensive by total estimated basket cost.
2. **Given** the user is not authenticated, **When** the grocery page loads, **Then** the Cheapest Grocery Store section is completely absent from the page with no visible placeholder or sign-in prompt.
3. **Given** the grocery page has an empty ingredient list, **When** the page loads, **Then** the Cheapest Grocery Store section is not shown.

---

### User Story 2 - Per-Ingredient Price Breakdown (Priority: P2)

The authenticated user wants to understand the price difference at a granular level. They expand a store's entry (or see a breakdown inline) to view the price of each individual ingredient at that store, enabling them to decide whether splitting the shop across two stores is worth the savings.

**Why this priority**: The ranked total alone tells you *where* to shop; the breakdown tells you *why* and enables smarter split-store decisions. High value but only useful after P1 exists.

**Independent Test**: With the Cheapest Grocery Store section visible, expand or view the per-ingredient breakdown for any store and verify each matched ingredient shows its unit price.

**Acceptance Scenarios**:

1. **Given** the Cheapest Grocery Store section is visible, **When** the user views the per-ingredient breakdown for a store, **Then** each ingredient from the list that was matched shows its price at that store.
2. **Given** some ingredients could not be matched to pricing data, **When** the user views the breakdown, **Then** unmatched ingredients are listed separately with a clear label such as "price not available" and are excluded from the store's total.
3. **Given** two stores carry the same ingredient at different prices, **When** the user views both breakdowns, **Then** the prices differ and reflect each store's data.

---

### User Story 3 - Price Data Freshness Indicator (Priority: P3)

The authenticated user wants to know how current the displayed prices are before acting on them. The section displays a "last updated" timestamp so the user can judge whether the data is recent enough to trust.

**Why this priority**: Stale prices can lead to a misleading recommendation. Transparency about data age protects the user from making a trip based on outdated information.

**Independent Test**: With the section visible, verify a "last updated" or "prices as of" timestamp is displayed and reflects the most recent data refresh.

**Acceptance Scenarios**:

1. **Given** the Cheapest Grocery Store section is visible, **When** the user looks at the section, **Then** a "prices as of [date/time]" indicator is shown.
2. **Given** pricing data has not been refreshed within the expected window (e.g., more than 7 days), **When** the section renders, **Then** a visual indicator or warning flags the data as potentially outdated.

---

### Edge Cases

- What happens when pricing data is completely unavailable (e.g., the last sync failed or sync has never run)? → Section shows a "pricing data unavailable — check back later" message rather than broken or empty content.
- What happens when only one store has pricing data? → Section still renders with the single store and its breakdown; no ranking is shown since there is nothing to compare.
- What happens when an ingredient name from the recipe does not match anything in the pricing database? → The ingredient is listed as "price not available" in the breakdown; the store total reflects only matched ingredients, with a visible count ("X of Y ingredients priced").
- What happens when the ingredient list changes (recipes added/removed from the grocery list)? → The price comparison recalculates to reflect the updated ingredient list.
- What happens if a store carries an ingredient but it is currently out of stock? → Out-of-stock items are treated the same as unmatched: listed separately, excluded from the total.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Cheapest Grocery Store section MUST be visible only to authenticated users; unauthenticated visitors MUST see no trace of the section.
- **FR-002**: The section MUST display a list of at least two grocery stores ranked from lowest to highest total estimated basket price for the current ingredient list.
- **FR-003**: Each store entry MUST display the store's name and its total estimated cost for all matched ingredients.
- **FR-004**: Each store entry MUST include a per-ingredient price breakdown showing the unit price of each matched ingredient at that store (e.g., $0.89/lb, $3.49/dozen). Extended pricing based on recipe quantities is out of scope.
- **FR-005**: The section MUST clearly indicate how many of the total ingredients were successfully matched to pricing data (e.g., "18 of 22 ingredients priced").
- **FR-006**: Ingredients that could not be matched to any store's pricing data MUST be listed separately in the breakdown and excluded from the store totals.
- **FR-007**: The section MUST display a "prices as of [date/time]" timestamp reflecting when the underlying pricing data was last refreshed.
- **FR-008**: When pricing data has not been refreshed within 7 days, the section MUST display a visible staleness warning alongside the timestamp.
- **FR-009**: When the most recent pricing sync failed (or no sync has ever succeeded), the section MUST display a clear unavailability message rather than empty or broken content. Data from a previously successful sync that is now 7+ days old is considered stale (FR-008), not unavailable.
- **FR-010**: The section MUST NOT be shown when the grocery page's ingredient list is empty.
- **FR-011**: The section MUST recalculate and re-render whenever the ingredient list changes (e.g., a recipe is added or removed from the grocery list).
- **FR-012**: The pricing data source MUST cover stores in a single configured geographic region; region selection is not user-configurable.
- **FR-013**: The system MUST obtain pricing data from at least one source at zero or low recurring cost (free tier, open data, or admin-maintained).

### Key Entities

- **Grocery Store**: A retail store included in the price comparison (name, geographic region).
- **Ingredient Price Record**: The known price of a matchable ingredient at a specific store (ingredient name, store, price, unit, last updated timestamp).
- **Price Comparison Result**: The computed output for a given ingredient list — one entry per store containing: store name, matched ingredient count, unmatched ingredient count, total estimated cost, per-ingredient price list.
- **Pricing Data Snapshot**: A versioned set of Ingredient Price Records from a specific sync event (source, sync timestamp, record count).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authenticated user can view a store price comparison for a non-empty ingredient list within 5 seconds of the grocery page loading.
- **SC-002**: When full pricing data is available, the comparison covers at least 2 grocery stores simultaneously. When only one store has data, the section renders with that single store and its breakdown (no ranking shown).
- **SC-003**: Price data is refreshed at least once per week; the last-updated timestamp is always visible alongside the comparison.
- **SC-004**: At least 80% of commonly used recipe ingredients (e.g., eggs, flour, butter, chicken, milk, olive oil) are matched to pricing data.
- **SC-005**: The section is completely invisible to unauthenticated visitors — verified by loading the grocery page while logged out and confirming no related HTML, text, or loading state appears.
- **SC-006**: When some ingredients are unmatched, a ranked total is still displayed for the matched subset, with the unmatched count clearly labelled.

## Assumptions

- The grocery page already exists and renders an ingredient list derived from one or more saved recipes; this feature adds a new section to that existing page rather than creating the page itself.
- Authentication state is available on the grocery page via the existing session system; no new auth infrastructure is needed.
- Geographic scope is a single fixed region matching the admin's location. Configuring the region is an admin setup task, not a runtime user action.
- Ingredient names from recipes may not exactly match pricing database keys; a normalization or fuzzy-matching step is expected to be part of the implementation (e.g., "all-purpose flour" → "flour"). When multiple products match a single ingredient, the lowest-priced match is used for that store's total.
- Pricing data does not need to be real-time. Data refreshed on a scheduled basis (e.g., nightly or weekly) is acceptable, provided the staleness indicator is shown.
- The feature is intended for personal use by the site's authenticated admin. Scaling to multiple concurrent users is out of scope.
- Store coverage is limited to stores that serve the configured geographic region; stores outside that region are not shown even if pricing data exists for them.
- The data source must have zero or very low ongoing cost (free API tier, publicly available data, or manually maintained records). Paid per-query APIs are out of scope unless a free tier covers expected usage.

## Clarifications

### Session 2026-06-02

- Q: Does the price comparison load automatically on page load, or does it require user action? → A: Automatic — prices load immediately when the page loads, no user interaction required.
- Q: When only one store has pricing data, is that a valid render or an error state? → A: Valid — single-store renders are acceptable degraded behavior; SC-002 applies only when full pricing data is available.
- Q: What distinguishes "stale" from "completely unavailable" pricing data? → A: Unavailable = last sync failed (or never succeeded); stale = last sync succeeded but data is 7+ days old. These are mutually exclusive states.
- Q: When an ingredient matches multiple products at a store, which price is used? → A: The lowest-priced match is used for that store's total.
- Q: Does the per-ingredient breakdown show unit price or extended price for the recipe quantity? → A: Unit price only (e.g., $0.89/lb). Extended pricing based on recipe quantities is out of scope.
