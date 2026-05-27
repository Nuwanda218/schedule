# Schedule Studio

Schedule Studio is a vanilla HTML/CSS/JavaScript schedule app for learning by building. It includes year, month, week, and day views; task editing; local JSON import/export; bilingual UI; seasonal themes; and localStorage persistence.

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Useful checks:

```bash
npm run check
npm run build
```

## Project Structure

```text
Schedule/
├── index.html
├── package.json
├── schedule-template.json
├── scripts/
│   └── check-assets.mjs
├── docs/
│   └── superpowers/plans/
└── assets/
    ├── css/
    │   ├── styles.css
    │   ├── base/
    │   │   ├── reset.css
    │   │   ├── responsive.css
    │   │   └── variables.css
    │   ├── components/
    │   │   ├── buttons.css
    │   │   ├── header.css
    │   │   ├── modal.css
    │   │   └── sidebar.css
    │   └── views/
    │       ├── day-view.css
    │       ├── month-view.css
    │       ├── week-view.css
    │       └── year-view.css
    ├── js/
    │   ├── app.js
    │   ├── button.js
    │   ├── components/
    │   │   └── settingsPanel.js
    │   ├── core/
    │   │   ├── constants.js
    │   │   └── storage.js
    │   └── modules/
    │       ├── dates.js
    │       ├── i18n.js
    │       ├── scheduleData.js
    │       ├── tasks.js
    │       └── theme.js
    └── data/
        ├── quotes/
        ├── schedule/
        └── theme/
```

## How The App Fits Together

`index.html` is the app shell. It declares the header, sidebar, view panels, and task modal. JavaScript finds elements through `id`, `class`, and `data-*` attributes.

`assets/css/styles.css` is the stylesheet entry. It imports base styles, component styles, and view styles in a deliberate order.

`assets/js/app.js` is still the main orchestration file. It wires DOM events, owns shared UI state, and calls smaller modules.

`assets/js/core/constants.js` stores shared constants such as storage keys, date labels, theme paths, and layout numbers.

`assets/js/core/storage.js` reads/writes task data in localStorage and creates starter tasks.

`assets/js/modules/dates.js` owns date formatting and calendar calculations.

`assets/js/modules/i18n.js` owns the bilingual text dictionary and language preference helpers.

`assets/js/modules/scheduleData.js` loads and normalizes JSON schedule data.

`assets/js/modules/tasks.js` owns task grouping, labels, and formatting helpers.

`assets/js/modules/theme.js` owns seasonal theme rules and persisted season preference.

`assets/js/components/settingsPanel.js` owns settings panel open/close behavior.

## Data Format

Task data follows this shape:

```json
{
  "tasks": [
    {
      "id": "task-1234",
      "title": "Design Sprint",
      "titleAlt": "设计冲刺",
      "date": "2026-01-18",
      "start": "09:30",
      "end": "11:30",
      "priority": "high",
      "tag": "studio",
      "notes": "Draft three directions.",
      "completed": false
    }
  ]
}
```

localStorage keys:

```text
schedule-studio-data-v1
schedule-studio-lang-v1
schedule-studio-season-v1
```

## Learning Path

1. Start with `index.html`: learn document structure, `id`, `class`, `data-*`, and semantic regions.
2. Read `assets/css/styles.css`: learn how CSS can be split while keeping one entry file.
3. Read `assets/js/app.js`: learn event binding, shared state, rendering, and local UI flow.
4. Read `assets/js/modules/dates.js`: learn small pure functions.
5. Read `assets/js/modules/scheduleData.js`: learn `fetch()`, JSON loading, and data normalization.
6. Read `assets/js/core/storage.js`: learn localStorage and persistence.
7. Continue extracting `app.js` only when a function has a clear boundary and explicit inputs.

## Current Refactor Boundary

The project has been split enough to make the main responsibilities visible. `app.js` still contains the view renderers because they share a lot of UI state. The next clean step is to introduce a small app context object, then move year/month/week/day renderers into `assets/js/views/`.
