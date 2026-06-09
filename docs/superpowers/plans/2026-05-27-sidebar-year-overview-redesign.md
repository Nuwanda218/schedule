# Sidebar Year Overview Redesign Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## File Structure

- `index.html`: remove visible focus filter panel and replace year snapshot markup with recent item + timeline containers.
- `assets/data/app-config.js`: set `modules.filters` to `false` so the hidden module is controlled by configuration.
- `assets/js/app.js`: stop rendering filter UI when disabled, render simplified recent item, and generate year timeline events.
- `assets/css/components/sidebar.css`: widen/clarify today panel, simplify year overview, style year timeline with theme event variables.
- `scripts/check-assets.mjs`: add structural checks for the new sidebar contract.
- `README.md`, `docs/project-structure-guide.md`, `docs/ideas/schedule-studio-roadmap.md`: document the new layout and timeline concept.

## Task 1: Define Sidebar Contract Check

- [ ] Add checks to `scripts/check-assets.mjs` that require `yearTimeline`, `yearTimelineEvents`, and `recentItemTitle`.
- [ ] Run `npm run check` and confirm it fails before markup is updated.

## Task 2: Update Markup and Config

- [ ] Set `modules.filters` to `false` in `assets/data/app-config.js`.
- [ ] Remove the focus filters panel from the visible sidebar in `index.html`.
- [ ] Replace the old two-card year overview with `recentItemTitle`, `recentItemMeta`, `yearTimeline`, `yearTimelineProgress`, `yearTimelineNow`, and `yearTimelineEvents`.
- [ ] Run `npm run check` and confirm it passes.

## Task 3: Update App Rendering

- [ ] Add new DOM references for the recent item and timeline elements in `assets/js/app.js`.
- [ ] Guard filter rendering/binding when `modules.filters` is false.
- [ ] Replace `renderYearOverview()` internals with recent item + timeline event rendering.
- [ ] Use `--event-plan-1`, `--event-plan-2`, `--event-plan-3`, and `--month-pill-holiday-strong-bg` compatible classes for event colors.

## Task 4: Update Sidebar Styles

- [ ] Remove now-unused overview card emphasis.
- [ ] Make the sidebar focus today tasks first.
- [ ] Add ticked year timeline styles with events alternating above and below the track.
- [ ] Ensure timeline event colors reuse existing theme variables.

## Task 5: Update Docs and Verify

- [ ] Update README and project structure guide with the new sidebar layout.
- [ ] Update roadmap with the design decision.
- [ ] Run `npm run check`.
- [ ] Run `npm run build`.
