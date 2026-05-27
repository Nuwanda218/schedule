# Schedule Project Split Implementation Plan
> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

## Goal

Restructure Schedule Studio in small, verifiable steps while keeping the app runnable after every checkpoint. Preserve current behavior. Use the restructure as a learning path: project config first, CSS next, then JavaScript modules.

## Target Structure

```text
Schedule/
├── index.html
├── README.md
├── package.json
├── .editorconfig
├── .gitattributes
├── .gitignore
├── schedule-template.json
├── docs/
│   └── superpowers/plans/2026-05-27-schedule-project-split.md
└── assets/
    ├── css/
    │   ├── styles.css
    │   ├── base/
    │   │   ├── reset.css
    │   │   ├── variables.css
    │   │   └── typography.css
    │   ├── components/
    │   │   ├── buttons.css
    │   │   ├── header.css
    │   │   ├── modal.css
    │   │   ├── panels.css
    │   │   └── sidebar.css
    │   └── views/
    │       ├── day-view.css
    │       ├── month-view.css
    │       ├── week-view.css
    │       └── year-view.css
    ├── js/
    │   ├── app.js
    │   ├── button.js
    │   ├── core/
    │   │   ├── constants.js
    │   │   ├── state.js
    │   │   └── storage.js
    │   ├── modules/
    │   │   ├── dates.js
    │   │   ├── i18n.js
    │   │   ├── scheduleData.js
    │   │   ├── tasks.js
    │   │   └── theme.js
    │   ├── views/
    │   │   ├── dayView.js
    │   │   ├── monthView.js
    │   │   ├── weekView.js
    │   │   └── yearView.js
    │   └── components/
    │       ├── settingsPanel.js
    │       └── taskModal.js
    └── data/
        ├── quotes/
        ├── schedule/
        └── theme/
```

## Verification Commands

Run after each checkpoint:

```bash
git status --short
npm run check
npm run dev -- --host 127.0.0.1
```

For static verification without a browser:

```bash
node scripts/check-assets.mjs
```

## Task 1: Baseline Project Config

**Files:**
- Create: `package.json`
- Create: `.editorconfig`
- Create: `.gitattributes`
- Create: `.gitignore`
- Create: `scripts/check-assets.mjs`
- Modify: `README.md`

- [ ] Add npm scripts for local serving and asset checks.
- [ ] Add line-ending rules to prevent noisy Windows diffs.
- [ ] Add ignored folders for dependencies and build outputs.
- [ ] Add a small asset checker that validates referenced CSS and JS files exist.
- [ ] Run `npm run check`.
- [ ] Commit: `chore: add project baseline config`

## Task 2: CSS Entry File

**Files:**
- Modify: `assets/css/styles.css`
- Create: files under `assets/css/base/`, `assets/css/components/`, and `assets/css/views/`

- [ ] Split CSS into import-based files.
- [ ] Keep `assets/css/styles.css` as the single HTML entry.
- [ ] Preserve selector behavior and CSS order.
- [ ] Run `npm run check`.
- [ ] Commit: `refactor: split stylesheet by responsibility`

## Task 3: JavaScript Module Entry

**Files:**
- Modify: `index.html`
- Modify: `assets/js/app.js`

- [ ] Change app script to `type="module"`.
- [ ] Keep runtime behavior unchanged.
- [ ] Confirm `button.js` still loads after app code or convert if required.
- [ ] Run `npm run check`.
- [ ] Commit: `refactor: prepare app script for modules`

## Task 4: Extract Core Utilities

**Files:**
- Modify: `assets/js/app.js`
- Create: `assets/js/core/constants.js`
- Create: `assets/js/core/storage.js`
- Create: `assets/js/modules/dates.js`

- [ ] Move constant lists and storage keys into `constants.js`.
- [ ] Move localStorage helpers into `storage.js`.
- [ ] Move date formatting/calculation into `dates.js`.
- [ ] Update imports in `app.js`.
- [ ] Run `npm run check`.
- [ ] Commit: `refactor: extract core utilities`

## Task 5: Extract Feature Modules

**Files:**
- Modify: `assets/js/app.js`
- Create: `assets/js/modules/i18n.js`
- Create: `assets/js/modules/theme.js`
- Create: `assets/js/modules/scheduleData.js`
- Create: `assets/js/modules/tasks.js`

- [ ] Move language dictionary and language persistence to `i18n.js`.
- [ ] Move season/theme path and DOM theme update logic to `theme.js`.
- [ ] Move JSON schedule loading and normalization to `scheduleData.js`.
- [ ] Move task create/save/filter helpers to `tasks.js`.
- [ ] Run `npm run check`.
- [ ] Commit: `refactor: extract feature modules`

## Task 6: Extract Views and Components

**Files:**
- Modify: `assets/js/app.js`
- Create: `assets/js/views/yearView.js`
- Create: `assets/js/views/monthView.js`
- Create: `assets/js/views/weekView.js`
- Create: `assets/js/views/dayView.js`
- Create: `assets/js/components/taskModal.js`
- Create: `assets/js/components/settingsPanel.js`

- [ ] Move render functions by view.
- [ ] Move task modal helpers into `taskModal.js`.
- [ ] Move settings panel behavior into `settingsPanel.js`.
- [ ] Keep shared state explicit through function parameters.
- [ ] Run `npm run check`.
- [ ] Commit: `refactor: extract view and component modules`

## Task 7: Final Documentation

**Files:**
- Modify: `README.md`

- [ ] Update current project structure.
- [ ] Add learning path explaining why files are split this way.
- [ ] Add common commands.
- [ ] Run `npm run check`.
- [ ] Commit: `docs: document project structure`
