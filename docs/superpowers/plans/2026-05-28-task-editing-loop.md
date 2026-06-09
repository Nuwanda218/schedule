# Task Editing Loop Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## File Structure

- `assets/js/modules/html.js`: escaping helpers for user/imported text rendered through template strings.
- `assets/js/modules/taskStore.js`: merge static schedule items with localStorage user tasks by date/range.
- `assets/js/app.js`: enable editing, use merged tasks, fix delete, escape rendered user text.
- `scripts/check-assets.mjs`: check that delete handling and escaping helpers exist.
- `README.md`, `docs/project-structure-guide.md`, `docs/ideas/schedule-studio-roadmap.md`: document editable task loop and visual-design timing.

## Task 1: RED Checks

- [ ] Add checks requiring `deleteTaskById`, `escapeHtml`, and editable mode.
- [ ] Run `npm run check` and confirm it fails.

## Task 2: Data Merge Helpers

- [ ] Add `assets/js/modules/html.js`.
- [ ] Add `assets/js/modules/taskStore.js`.
- [ ] Merge user tasks into month/week/day items without mutating schedule JSON arrays.

## Task 3: App Editing Loop

- [ ] Set `state.isReadOnly` to `false`.
- [ ] Load localStorage tasks once during init.
- [ ] Use merged month/week/day items for rendering and stats.
- [ ] Save, edit, and delete tasks through localStorage user tasks.
- [ ] Escape task and event text before writing template HTML.

## Task 4: Docs and Verification

- [ ] Update docs with task editing flow.
- [ ] Explain visual polishing timing: after core interaction, before final feature expansion.
- [ ] Run `npm run check`.
- [ ] Run `npm run build`.
