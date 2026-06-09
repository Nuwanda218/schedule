import {
  I18N,
  formatBilingual,
  getSecondaryLanguage,
  getText,
  loadLanguage,
  saveLanguage
} from "./modules/i18n.js";
import { loadDayData, loadScheduleData } from "./modules/scheduleData.js";
import {
  formatDayCount,
  formatDayHeader,
  formatHolidayLabel,
  formatMoreLabel,
  formatRangeLabelForLang,
  formatTaskCount,
  groupByDate,
  toHourValue
} from "./modules/tasks.js";
import { fetchQuotes } from "./modules/quotes.js";
import { escapeAttribute, escapeHtml } from "./modules/html.js";
import {
  getConfig,
  getDefaultTaskConfig,
  getEnabledPriorities,
  getEnabledStatusFilters,
  getEnabledTags
} from "./modules/config.js";
import { toggleSettingsPanel as toggleSettingsPanelComponent } from "./components/settingsPanel.js";
import {
  getSeasonThemePath,
  loadSeason,
  normalizeSeason,
  saveSeason
} from "./modules/theme.js";
import {
  getTasksForDate,
  getTasksForMonth,
  getTasksForWeek,
  mergeTasks,
  normalizeTask,
  sortTasksByDateTime
} from "./modules/taskStore.js";
import { showToast } from "./modules/toast.js";
import {
  formatDate,
  getMonthName,
  getMonthShort,
  getDayName,
  formatShortDate,
  diffInDays,
  getDaysInMonth,
  parseDate,
  addDays,
  getWeekIndex,
  getWeekStart,
  getDayIndex
} from "./modules/dates.js";

import {
  LANG_STORAGE_KEY,
  DEFAULT_LANGUAGE,
  DEFAULT_SEASON,
  DAY_START,
  DAY_END,
  HOUR_HEIGHT,
  MONTH_SHORT,
  MONTH_SHORT_ZH,
  LANG_NAMES
} from "./core/constants.js";
import {
  createTask,
  readStoredTasks,
  seedTasks,
  writeStoredTasks
} from "./core/storage.js";

const PLAN_HEATMAP_COLORS = ["var(--event-plan-1)", "var(--event-plan-2)", "var(--event-plan-3)"];
const appConfig = getConfig();

const state = {
  view: appConfig.defaults.view,
  currentDate: new Date(),
  filterTag: "all",
  filterStatus: "all",
  language: appConfig.defaults.language || DEFAULT_LANGUAGE,
  season: appConfig.defaults.season || DEFAULT_SEASON,
  statusKey: "statusReady",
  isReadOnly: false,
  yearView: appConfig.defaults.yearView,
  todayCacheKey: "",
  todayTasks: [],
  quotes: [],
  quotesLoaded: false,
  quoteIndex: -1,
  data: {
    year: null,
    month: null,
    week: null,
    day: null
  },
  storedTasks: [],
  tasks: []
};

const ui = {};

async function init() {
  cacheElements();
  state.language = loadLanguage();
  state.season = loadSeason();
  renderConfiguredContent();
  cacheDynamicElements();
  bindUI();
  applySeason(state.season);
  applyTheme(ui.themeToggle ? ui.themeToggle.getAttribute("value") || "light" : "light");
  setView(state.view);
  setYearView(state.yearView);
  state.storedTasks = loadTasks();
  await loadScheduleDataForCurrentDate();
  applyLanguage(false);
  renderAll();
  document.body.classList.add("is-loaded");
}

function cacheElements() {
  ui.brandMark = document.getElementById("brandMark");
  ui.brandEyebrow = document.getElementById("brandEyebrow");
  ui.zoomNav = document.getElementById("zoomNav");
  ui.zoomSlider = document.getElementById("zoomSlider");
  ui.zoomBreadcrumb = document.getElementById("zoomBreadcrumb");
  ui.zoomLabels = document.querySelectorAll(".zoom-labels span");
  ui.viewPanels = document.querySelectorAll(".view-panel");
  ui.rangeLabel = document.getElementById("rangeLabel");
  ui.yearGrid = document.getElementById("yearGrid");
  ui.yearSummary = document.getElementById("yearSummary");
  ui.monthGrid = document.getElementById("monthGrid");
  ui.weekGrid = document.getElementById("weekGrid");
  ui.dayGrid = document.getElementById("dayGrid");
  ui.todayBadge = document.getElementById("todayBadge");
  ui.todayList = document.getElementById("todayList");
  ui.todayEmpty = document.getElementById("todayEmpty");
  ui.todayQuote = document.getElementById("todayQuote");
  ui.todayQuoteSource = document.getElementById("todayQuoteSource");
  ui.todayQuoteButton = document.getElementById("todayQuoteButton");
  ui.yearProgressValue = document.getElementById("yearProgressValue");
  ui.yearProgressBadge = document.getElementById("yearProgressBadge");
  ui.recentItemTitle = document.getElementById("recentItemTitle");
  ui.recentItemMeta = document.getElementById("recentItemMeta");
  ui.yearTimeline = document.getElementById("yearTimeline");
  ui.yearTimelineProgress = document.getElementById("yearTimelineProgress");
  ui.yearTimelineNow = document.getElementById("yearTimelineNow");
  ui.yearTimelineEvents = document.getElementById("yearTimelineEvents");
  ui.modal = document.getElementById("taskModal");
  ui.modalTitle = document.getElementById("modalTitle");
  ui.taskForm = document.getElementById("taskForm");
  ui.taskId = document.getElementById("taskId");
  ui.taskTitle = document.getElementById("taskTitle");
  ui.taskDate = document.getElementById("taskDate");
  ui.taskStart = document.getElementById("taskStart");
  ui.taskEnd = document.getElementById("taskEnd");
  ui.taskPriority = document.getElementById("taskPriority");
  ui.taskTag = document.getElementById("taskTag");
  ui.taskNotes = document.getElementById("taskNotes");
  ui.taskCompleted = document.getElementById("taskCompleted");
  ui.deleteTask = document.getElementById("deleteTask");
  ui.yearViewButtons = document.querySelectorAll("[data-year-view]");
  ui.yearViewPanels = document.querySelectorAll("[data-year-view-panel]");
  ui.yearHeatmapMonths = document.getElementById("yearHeatmapMonths");
  ui.yearHeatmapDays = document.getElementById("yearHeatmapDays");
  ui.yearHeatmapGrid = document.getElementById("yearHeatmapGrid");
  ui.yearHeatmapLegend = document.getElementById("yearHeatmapLegend");
  ui.cornerControls = document.querySelector(".corner-controls");
  ui.settingsToggle = document.getElementById("settingsToggle");
  ui.settingsPanel = document.getElementById("settingsPanel");
  ui.seasonThemeLink = document.getElementById("seasonTheme");
  ui.langToggle = document.getElementById("langToggle");
  ui.seasonToggle = document.getElementById("seasonToggle");
  ui.seasonButtons = document.querySelectorAll(".season-option");
  ui.themeToggle = document.getElementById("themeToggle");
}

function cacheDynamicElements() {
  ui.zoomLabels = document.querySelectorAll(".zoom-labels span");
  ui.seasonButtons = document.querySelectorAll(".season-option");
}

function renderConfiguredContent() {
  renderBrandConfig();
  renderZoomLabels();
  renderFilterChips();
  renderTaskSelectOptions();
}

function renderBrandConfig() {
  if (ui.brandMark) {
    ui.brandMark.textContent = `\u26a1${appConfig.brand.mark}`;
  }
  if (ui.brandEyebrow) {
    ui.brandEyebrow.textContent = appConfig.brand.eyebrow;
  }
}

const ZOOM_LEVELS = ["year", "month", "week", "day"];

function renderZoomLabels() {
  if (!ui.zoomLabels) {
    return;
  }
  ui.zoomLabels.forEach((label) => {
    const key = label.dataset.i18n;
    if (key) {
      label.textContent = getText(key, state.language);
    }
  });
  syncZoomUI();
}

function syncZoomUI() {
  const index = ZOOM_LEVELS.indexOf(state.view);
  if (ui.zoomSlider) {
    ui.zoomSlider.value = index;
  }
  if (ui.zoomLabels) {
    ui.zoomLabels.forEach((label) => {
      label.classList.toggle("is-active", Number(label.dataset.zoom) === index);
    });
  }
  updateBreadcrumb();
}

function updateBreadcrumb() {
  if (!ui.zoomBreadcrumb) {
    return;
  }
  const date = state.currentDate;
  const primary = state.language;
  const crumbs = [];

  // Year crumb (always present)
  crumbs.push({ level: "year", label: String(date.getFullYear()) });

  // Month crumb (month level and below)
  if (state.view !== "year") {
    crumbs.push({ level: "month", label: getMonthName(date.getMonth(), primary) });
  }

  // Week crumb (week level and below)
  if (state.view === "week" || state.view === "day") {
    crumbs.push({ level: "week", label: `W${getWeekIndex(date)}` });
  }

  // Day crumb (day level only)
  if (state.view === "day") {
    const dayLabel = `${getDayName(date.getDay(), primary)} ${date.getDate()}`;
    crumbs.push({ level: "day", label: dayLabel });
  }

  ui.zoomBreadcrumb.innerHTML = crumbs
    .map((crumb, i) => {
      const isCurrent = i === crumbs.length - 1;
      const sep = i > 0 ? '<span class="crumb-sep">›</span>' : "";
      const cls = isCurrent ? "crumb is-current" : "crumb";
      return `${sep}<span class="${cls}" data-zoom-level="${crumb.level}">${escapeHtml(crumb.label)}</span>`;
    })
    .join("");
}

function renderFilterChips() {
  if (!appConfig.modules.filters) {
    return;
  }
  const tagRow = document.querySelector('[data-filter-group="tag"]');
  const statusRow = document.querySelector('[data-filter-group="status"]');

  if (tagRow) {
    const tagItems = [{ id: "all", labelKey: "all" }, ...getEnabledTags()];
    tagRow.innerHTML = tagItems.map((item) => renderChip(item, state.filterTag)).join("");
  }

  if (statusRow) {
    statusRow.innerHTML = getEnabledStatusFilters().map((item) => renderChip(item, state.filterStatus)).join("");
  }
}

function renderChip(item, activeValue) {
  const activeClass = item.id === activeValue ? " is-active" : "";
  return `<button class="chip${activeClass}" data-filter-value="${item.id}" data-i18n="${item.labelKey}" type="button">${getText(item.labelKey, state.language)}</button>`;
}

function renderTaskSelectOptions() {
  renderSelectOptions(ui.taskPriority, getEnabledPriorities(), appConfig.defaults.newTask.priority);
  renderSelectOptions(ui.taskTag, getEnabledTags(), appConfig.defaults.newTask.tag);
}

function renderSelectOptions(select, items, defaultValue) {
  if (!select) {
    return;
  }

  select.innerHTML = items
    .map((item) => {
      const selected = item.id === defaultValue ? " selected" : "";
      return `<option value="${item.id}" data-i18n-option="${item.labelKey}"${selected}>${getText(item.labelKey, state.language)}</option>`;
    })
    .join("");
}

function bindUI() {
  // Zoom slider
  if (ui.zoomSlider) {
    ui.zoomSlider.addEventListener("input", () => {
      const level = ZOOM_LEVELS[Number(ui.zoomSlider.value)];
      if (level) {
        setView(level);
        renderAll();
      }
    });
  }

  // Zoom label clicks
  if (ui.zoomLabels) {
    ui.zoomLabels.forEach((label) => {
      label.addEventListener("click", () => {
        const level = ZOOM_LEVELS[Number(label.dataset.zoom)];
        if (level) {
          setView(level);
          renderAll();
        }
      });
    });
  }

  // Breadcrumb clicks
  if (ui.zoomBreadcrumb) {
    ui.zoomBreadcrumb.addEventListener("click", (event) => {
      const crumb = event.target.closest(".crumb");
      if (!crumb || crumb.classList.contains("is-current")) {
        return;
      }
      const level = crumb.dataset.zoomLevel;
      if (level && ZOOM_LEVELS.includes(level)) {
        setView(level);
        renderAll();
      }
    });
  }

  if (ui.yearViewButtons && ui.yearViewButtons.length) {
    ui.yearViewButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setYearView(button.dataset.yearView);
      });
    });
  }

  document.querySelectorAll("[data-shift]").forEach((button) => {
    button.addEventListener("click", () => shiftRange(Number(button.dataset.shift)));
  });

  document.querySelector('[data-action="today"]').addEventListener("click", () => {
    updateCurrentDate(new Date());
    if (state.view === "year") {
      spotlightTodayCard();
    }
  });

  document.querySelector('[data-action="add"]').addEventListener("click", () => {
    if (state.isReadOnly) {
      setStatusKey("statusReadOnly");
      return;
    }
    openModal();
  });

  if (appConfig.modules.filters) {
    document.querySelectorAll(".chip-row").forEach((row) => {
      row.addEventListener("click", (event) => {
        const chip = event.target.closest(".chip");
        if (!chip) {
          return;
        }
        row.querySelectorAll(".chip").forEach((item) => {
          item.classList.toggle("is-active", item === chip);
        });
        const group = row.dataset.filterGroup;
        const value = chip.dataset.filterValue;
        if (group === "tag") {
          state.filterTag = value;
        }
        if (group === "status") {
          state.filterStatus = value;
        }
        renderAll();
      });
    });
  }

  ui.yearGrid.addEventListener("click", (event) => {
    const card = event.target.closest(".month-card");
    if (!card) {
      return;
    }
    const monthIndex = Number(card.dataset.month);
    const year = state.currentDate.getFullYear();
    updateCurrentDate(new Date(year, monthIndex, 1), "month");
  });

  ui.monthGrid.addEventListener("click", (event) => {
    if (event.target.closest("[data-task-id]")) {
      return;
    }
    const day = event.target.closest(".month-day");
    if (!day) {
      return;
    }
    const dateValue = day.dataset.date;
    if (dateValue) {
      updateCurrentDate(parseDate(dateValue), "week");
    }
  });

  ui.weekGrid.addEventListener("click", (event) => {
    if (event.target.closest("[data-task-id]")) {
      return;
    }
    const header = event.target.closest(".day-header");
    if (!header) {
      return;
    }
    const column = header.closest(".day-column");
    if (column && column.dataset.date) {
      updateCurrentDate(parseDate(column.dataset.date), "day");
    }
  });

  document.addEventListener("click", (event) => {
    const checkBtn = event.target.closest(".task-check");
    if (checkBtn) {
      event.stopPropagation();
      const taskEl = checkBtn.closest("[data-task-id]") || checkBtn.parentElement;
      const taskId = checkBtn.dataset.taskId || (taskEl && taskEl.dataset.taskId);
      if (taskId) {
        checkBtn.classList.add("just-checked");
        setTimeout(() => checkBtn.classList.remove("just-checked"), 300);
        toggleTaskCompletion(taskId);
      }
      return;
    }
    const taskTarget = event.target.closest("[data-task-id]");
    if (!taskTarget) {
      return;
    }
    const task = getActiveItems().find((item) => item.id === taskTarget.dataset.taskId);
    if (task) {
      openModal(task);
    }
  });


  if (ui.todayQuoteButton) {
    ui.todayQuoteButton.addEventListener("click", () => {
      shuffleQuote();
    });
  }

  ui.modal.addEventListener("click", (event) => {
    if (event.target === ui.modal) {
      closeModal();
    }
  });

  ui.modal.querySelectorAll('[data-action="close"]').forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  ui.taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (state.isReadOnly) {
      setStatusKey("statusReadOnly");
      return;
    }
    saveTaskFromForm();
  });

  ui.deleteTask.addEventListener("click", () => {
    if (state.isReadOnly) {
      setStatusKey("statusReadOnly");
      return;
    }
    deleteTaskById(ui.taskId.value);
  });

  if (ui.langToggle) {
    ui.langToggle.addEventListener("click", () => {
      state.language = state.language === "en" ? "zh" : "en";
      saveLanguage(state.language);
      applyLanguage();
    });
  }

  if (ui.settingsToggle && ui.settingsPanel && ui.cornerControls) {
    ui.settingsToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleSettingsPanel();
    });
    ui.settingsPanel.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    document.addEventListener("click", (event) => {
      if (!ui.cornerControls.contains(event.target)) {
        toggleSettingsPanel(false);
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        toggleSettingsPanel(false);
      }
    });
  }

  if (ui.seasonButtons && ui.seasonButtons.length) {
    ui.seasonButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setSeason(button.dataset.season);
      });
    });
  }

  if (ui.themeToggle) {
    ui.themeToggle.addEventListener("change", (event) => {
      applyTheme(event.detail);
    });
  }

  document.addEventListener("keydown", (event) => {
    // Skip shortcuts when typing in inputs
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || event.target.isContentEditable) {
      if (event.key === "Escape") {
        event.target.blur();
      }
      return;
    }

    // Modal is open — only Escape applies
    if (ui.modal.classList.contains("is-open")) {
      if (event.key === "Escape") {
        closeModal();
      }
      return;
    }

    switch (event.key) {
      case "n":
      case "N":
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          if (state.isReadOnly) {
            showToast(getText("statusReadOnly", state.language), { type: "error" });
          } else {
            openModal();
          }
        }
        break;
      case "t":
      case "T":
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          updateCurrentDate(new Date());
        }
        break;
      case "=":
      case "+":
        event.preventDefault();
        zoomIn();
        break;
      case "-":
        event.preventDefault();
        zoomOut();
        break;
      case "ArrowLeft":
        event.preventDefault();
        shiftRange(-1);
        break;
      case "ArrowRight":
        event.preventDefault();
        shiftRange(1);
        break;
      case "?":
        event.preventDefault();
        toggleShortcutHint();
        break;
      default:
        break;
    }
  });
}

let shortcutHintEl = null;

function toggleShortcutHint() {
  if (!shortcutHintEl) {
    shortcutHintEl = document.createElement("div");
    shortcutHintEl.className = "shortcut-hint";
    shortcutHintEl.innerHTML = `
      <div><kbd>N</kbd> ${getText("shortcutAdd", state.language)}</div>
      <div><kbd>T</kbd> ${getText("shortcutToday", state.language)}</div>
      <div><kbd>+</kbd> / <kbd>-</kbd> ${getText("shortcutZoom", state.language)}</div>
      <div><kbd>←</kbd> <kbd>→</kbd> ${getText("shortcutNav", state.language)}</div>
      <div><kbd>Esc</kbd> ${getText("shortcutClose", state.language)}</div>
    `;
    document.body.appendChild(shortcutHintEl);
    requestAnimationFrame(() => shortcutHintEl.classList.add("is-visible"));
  } else {
    const el = shortcutHintEl;
    el.classList.remove("is-visible");
    setTimeout(() => { el.remove(); }, 200);
    shortcutHintEl = null;
  }
}

function applyLanguage(shouldRender = true) {
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);

  document.documentElement.setAttribute("lang", primary);
  renderBrandConfig();
  renderZoomLabels();
  renderFilterChips();
  renderTaskSelectOptions();
  cacheDynamicElements();

  if (ui.langToggle) {
    ui.langToggle.innerHTML = formatBilingual(LANG_NAMES[primary], LANG_NAMES[secondary], primary);
    ui.langToggle.setAttribute("aria-label", getText("langToggleAria", primary));
  }

  if (ui.settingsToggle) {
    const settingsLabel = getText("settingsToggleAria", primary);
    if (settingsLabel) {
      ui.settingsToggle.setAttribute("aria-label", settingsLabel);
    }
  }

  if (ui.seasonToggle) {
    const seasonLabel = getText("seasonToggleAria", primary);
    if (seasonLabel) {
      ui.seasonToggle.setAttribute("aria-label", seasonLabel);
    }
  }

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    const primaryText = getText(key, primary);
    const secondaryText = getText(key, secondary);
    if (!primaryText || !secondaryText) {
      return;
    }
    element.innerHTML = formatBilingual(primaryText, secondaryText, primary);
  });

  document.querySelectorAll("[data-i18n-option]").forEach((option) => {
    const key = option.dataset.i18nOption;
    const primaryText = getText(key, primary);
    if (primaryText) {
      option.textContent = primaryText;
    }
  });

  if (ui.taskTitle) {
    ui.taskTitle.placeholder = getText("placeholderTitle", primary);
  }
  if (ui.taskNotes) {
    ui.taskNotes.placeholder = getText("placeholderNotes", primary);
  }

  updateModalTitle();

  if (shouldRender) {
    renderAll();
  }
}

function toggleSettingsPanel(forceOpen) {
  toggleSettingsPanelComponent(ui, forceOpen);
}

function getActiveTheme() {
  if (document.body.dataset.theme) {
    return document.body.dataset.theme;
  }
  if (ui.themeToggle) {
    return ui.themeToggle.getAttribute("value") || "light";
  }
  return "light";
}

function applySeason(season) {
  const nextSeason = normalizeSeason(season);
  document.body.dataset.season = nextSeason;
  updateSeasonThemeLink(nextSeason, getActiveTheme());
  if (!ui.seasonButtons || !ui.seasonButtons.length) {
    return;
  }
  ui.seasonButtons.forEach((button) => {
    const isActive = button.dataset.season === nextSeason;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setSeason(season) {
  const nextSeason = normalizeSeason(season);
  state.season = nextSeason;
  applySeason(nextSeason);
  saveSeason(nextSeason);
}

function updateSeasonThemeLink(season, theme) {
  if (!ui.seasonThemeLink) {
    return;
  }
  const themePath = getSeasonThemePath(season, theme);
  if (ui.seasonThemeLink.getAttribute("href") !== themePath) {
    ui.seasonThemeLink.setAttribute("href", themePath);
  }
}

function applyTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = nextTheme;
  if (ui.themeToggle) {
    ui.themeToggle.setAttribute("value", nextTheme);
  }
  updateSeasonThemeLink(state.season, nextTheme);
}

function setModalTitle(key) {
  if (!ui.modalTitle) {
    return;
  }
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);
  const primaryText = getText(key, primary);
  const secondaryText = getText(key, secondary);
  if (!primaryText || !secondaryText) {
    ui.modalTitle.textContent = primaryText || "";
    return;
  }
  ui.modalTitle.innerHTML = formatBilingual(primaryText, secondaryText, primary);
}

function updateModalTitle() {
  if (!ui.modalTitle || !ui.taskId) {
    return;
  }
  const key = ui.taskId.value ? "modalEditTitle" : "modalAddTitle";
  setModalTitle(key);
}

function setStatusKey(key) {
  state.statusKey = key;
  const message = getText(key, state.language);
  if (message) {
    showToast(message, { type: "error" });
  }
}

async function loadScheduleDataForCurrentDate() {
  state.data = await loadScheduleData(state.currentDate);
}

async function updateCurrentDate(nextDate, nextView) {
  state.currentDate = nextDate;
  if (nextView) {
    setView(nextView);
  }
  await loadScheduleDataForCurrentDate();
  renderAll();
}

function getMonthItems() {
  const baseItems = state.data.month && Array.isArray(state.data.month.items) ? state.data.month.items : [];
  return mergeTasks(baseItems, getTasksForMonth(state.storedTasks, state.currentDate));
}

function getWeekItems() {
  const baseItems = state.data.week && Array.isArray(state.data.week.items) ? state.data.week.items : [];
  return mergeTasks(baseItems, getTasksForWeek(state.storedTasks, state.currentDate));
}

function getDayItems() {
  const dateKey = formatDate(state.currentDate);
  const storedItems = getTasksForDate(state.storedTasks, dateKey);
  if (!state.data.day || !Array.isArray(state.data.day.days)) {
    return storedItems;
  }
  const entry = state.data.day.days.find((day) => day.date === dateKey);
  if (entry && Array.isArray(entry.items)) {
    return mergeTasks(entry.items, storedItems);
  }
  return storedItems;
}

function getActiveItems() {
  if (state.view === "month") {
    return applyFilters(getMonthItems());
  }
  if (state.view === "week") {
    return applyFilters(getWeekItems());
  }
  if (state.view === "day") {
    return applyFilters(getDayItems());
  }
  return [];
}


function renderAll() {
  renderYearView(state.data.year);
  renderYearOverview(state.data.year);
  renderTodayPanel();
  renderMonthView(applyFilters(getMonthItems()));
  renderWeekView(applyFilters(getWeekItems()));
  renderDayView(applyFilters(getDayItems()));
  updateRangeLabel();
  syncZoomUI();
  state.tasks = getActiveItems();
}

function setView(view) {
  state.view = view;
  ui.viewPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
  });
  syncZoomUI();
}

function setYearView(view) {
  const nextView = view === "heatmap" ? "heatmap" : "cards";
  state.yearView = nextView;
  if (ui.yearViewButtons) {
    ui.yearViewButtons.forEach((button) => {
      const isActive = button.dataset.yearView === nextView;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }
  if (ui.yearViewPanels) {
    ui.yearViewPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.yearViewPanel === nextView);
    });
  }
}

function shiftRange(amount) {
  const next = new Date(state.currentDate);
  if (state.view === "year") {
    next.setFullYear(next.getFullYear() + amount);
  } else if (state.view === "month") {
    next.setMonth(next.getMonth() + amount);
  } else if (state.view === "week") {
    next.setDate(next.getDate() + amount * 7);
  } else {
    next.setDate(next.getDate() + amount);
  }
  updateCurrentDate(next);
}

function zoomIn() {
  const index = ZOOM_LEVELS.indexOf(state.view);
  if (index < ZOOM_LEVELS.length - 1) {
    setView(ZOOM_LEVELS[index + 1]);
    renderAll();
  }
}

function zoomOut() {
  const index = ZOOM_LEVELS.indexOf(state.view);
  if (index > 0) {
    setView(ZOOM_LEVELS[index - 1]);
    renderAll();
  }
}

function updateRangeLabel() {
  const date = state.currentDate;
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);
  const primaryText = formatRangeLabelForLang(date, state.view, primary);
  const secondaryText = formatRangeLabelForLang(date, state.view, secondary);
  ui.rangeLabel.innerHTML = formatBilingual(primaryText, secondaryText, primary);
}


function renderTodayPanel() {
  if (!ui.todayList || !ui.todayEmpty) {
    return;
  }
  const today = new Date();
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);
  if (ui.todayBadge) {
    const primaryText = formatShortDate(today, primary);
    const secondaryText = formatShortDate(today, secondary);
    ui.todayBadge.innerHTML = formatBilingual(primaryText, secondaryText, primary);
  }
  loadTodayTasks(today)
    .then((items) => {
      renderTodayItems(items);
      renderTodayQuote(false);
    })
    .catch(() => {
      renderTodayItems([]);
      renderTodayQuote(false);
    });
}

function renderTodayItems(items) {
  if (!ui.todayList || !ui.todayEmpty) {
    return;
  }
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);
  const tasks = Array.isArray(items) ? items : [];
  if (!tasks.length) {
    ui.todayList.hidden = true;
    ui.todayEmpty.hidden = false;
    return;
  }
  ui.todayEmpty.hidden = true;
  ui.todayList.hidden = false;
  const sorted = [...tasks].sort((a, b) => getTimeSortValue(a) - getTimeSortValue(b));
  ui.todayList.innerHTML = sorted
    .map((task) => {
      const titlePrimary = escapeHtml(task.title || "-");
      const titleSecondary = escapeHtml(task.titleAlt || task.title || "-");
      const timeLabel = escapeHtml(formatTimeRange(task));
      const doneClass = task.completed ? " is-done" : "";
      const checkedClass = task.completed ? " is-checked" : "";
      const taskIdAttr = task.id ? ` data-task-id="${escapeAttribute(task.id)}"` : "";
      return `<li class="today-item${doneClass}"${taskIdAttr}><button class="task-check${checkedClass}" data-task-id="${escapeAttribute(task.id)}" type="button" aria-label="Toggle complete"></button><span class="today-time">${timeLabel}</span><span class="today-title">${formatBilingual(titlePrimary, titleSecondary, primary)}</span></li>`;
    })
    .join("");
}

function getTimeSortValue(task) {
  if (task && task.start) {
    return toHourValue(task.start);
  }
  return 99;
}

function formatTimeRange(task) {
  if (!task) {
    return "--";
  }
  const start = task.start || "";
  const end = task.end || "";
  if (start && end) {
    return `${start}-${end}`;
  }
  return start || end || "--";
}

async function loadTodayTasks(today) {
  const todayKey = formatDate(today);
  if (state.todayCacheKey === todayKey && Array.isArray(state.todayTasks)) {
    return state.todayTasks;
  }
  const normalized = await loadDayData(today);
  const items = getDayItemsFromData(normalized, todayKey);
  const storedItems = getTasksForDate(state.storedTasks, todayKey);
  state.todayCacheKey = todayKey;
  state.todayTasks = mergeTasks(items, storedItems);
  return state.todayTasks;
}

function getDayItemsFromData(dayData, dateKey) {
  if (!dayData || !Array.isArray(dayData.days)) {
    return [];
  }
  const entry = dayData.days.find((day) => day.date === dateKey);
  if (!entry || !Array.isArray(entry.items)) {
    return [];
  }
  return entry.items;
}

function loadQuotes() {
  if (state.quotesLoaded) {
    return Promise.resolve(Array.isArray(state.quotes) ? state.quotes : []);
  }
  return fetchQuotes().then((quotes) => {
    state.quotes = quotes;
    state.quotesLoaded = true;
    return quotes;
  });
}

function pickQuoteIndex(quotes, forceNew) {
  if (!quotes.length) {
    return -1;
  }
  if (!forceNew && state.quoteIndex >= 0 && state.quoteIndex < quotes.length) {
    return state.quoteIndex;
  }
  let next = Math.floor(Math.random() * quotes.length);
  if (forceNew && quotes.length > 1) {
    while (next === state.quoteIndex) {
      next = Math.floor(Math.random() * quotes.length);
    }
  }
  state.quoteIndex = next;
  return next;
}

function renderTodayQuote(forceNew) {
  if (!ui.todayQuote) {
    return;
  }
  loadQuotes()
    .then((quotes) => {
      if (!quotes.length) {
        const primary = state.language;
        const secondary = getSecondaryLanguage(primary);
        const primaryText = getText("todayEmptyFallback", primary);
        const secondaryText = getText("todayEmptyFallback", secondary);
        ui.todayQuote.innerHTML = formatBilingual(primaryText, secondaryText, primary);
        if (ui.todayQuoteSource) {
          ui.todayQuoteSource.textContent = "";
          ui.todayQuoteSource.style.display = "none";
        }
        return;
      }
      const index = pickQuoteIndex(quotes, forceNew);
      const quote = quotes[index] || {};
      const primary = state.language;
      const secondary = getSecondaryLanguage(primary);
      const primaryText = primary == "zh" ? quote.zh : quote.en;
      const secondaryText = secondary == "zh" ? quote.zh : quote.en;
      const safePrimary = primaryText || secondaryText || "";
      const safeSecondary = secondaryText || primaryText || "";
      ui.todayQuote.innerHTML = formatBilingual(safePrimary, safeSecondary, primary);

      if (ui.todayQuoteSource) {
        const primarySource = primary == "zh" ? quote.sourceZh : quote.sourceEn;
        const secondarySource = secondary == "zh" ? quote.sourceZh : quote.sourceEn;
        if (primarySource || secondarySource) {
          const safeSourcePrimary = primarySource || secondarySource || "";
          const safeSourceSecondary = secondarySource || primarySource || "";
          ui.todayQuoteSource.innerHTML = formatBilingual(`- ${safeSourcePrimary}`, `- ${safeSourceSecondary}`, primary);
          ui.todayQuoteSource.style.display = "";
        } else {
          ui.todayQuoteSource.textContent = "";
          ui.todayQuoteSource.style.display = "none";
        }
      }
    })
    .catch(() => {
      const primary = state.language;
      const secondary = getSecondaryLanguage(primary);
      const primaryText = getText("todayEmptyFallback", primary);
      const secondaryText = getText("todayEmptyFallback", secondary);
      ui.todayQuote.innerHTML = formatBilingual(primaryText, secondaryText, primary);
      if (ui.todayQuoteSource) {
        ui.todayQuoteSource.textContent = "";
        ui.todayQuoteSource.style.display = "none";
      }
    });
}

function shuffleQuote() {
  renderTodayQuote(true);
}
function renderYearView(yearData) {
  const year = yearData && yearData.year ? yearData.year : state.currentDate.getFullYear();
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);
  const holidays = yearData && Array.isArray(yearData.holidays) ? yearData.holidays : [];
  const plans = yearData && Array.isArray(yearData.plans) ? yearData.plans : [];
  const holidaysByMonth = new Array(12).fill(null).map(() => []);
  const plansByMonth = new Array(12).fill(null).map(() => []);

  holidays.forEach((holiday) => {
    if (!holiday.date) {
      return;
    }
    const date = parseDate(holiday.date);
    if (date.getFullYear() !== year) {
      return;
    }
    holidaysByMonth[date.getMonth()].push(holiday);
  });

  plans.forEach((plan) => {
    const months = Array.isArray(plan.months) ? plan.months : [];
    months.forEach((monthNumber) => {
      const index = monthNumber - 1;
      if (index >= 0 && index < 12) {
        plansByMonth[index].push(plan);
      }
    });
  });

  renderYearCards(year, primary, secondary, plansByMonth, holidaysByMonth);
  renderYearHeatmap(year, primary, secondary, plans, holidays);

  const statutoryCount = holidays.filter((holiday) => holiday.type === "statutory").length;
  const allHolidayCount = holidays.length;
  const planCount = plans.length;
  ui.yearSummary.innerHTML = `
    <div class="summary-card">
      <div class="summary-label">${formatBilingual(getText("summaryPlans", primary), getText("summaryPlans", secondary), primary)}</div>
      <div class="summary-value">${formatBilingual(String(planCount), String(planCount), primary)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">${formatBilingual(getText("summaryStatHolidays", primary), getText("summaryStatHolidays", secondary), primary)}</div>
      <div class="summary-value">${formatBilingual(String(statutoryCount), String(statutoryCount), primary)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">${formatBilingual(getText("summaryHolidays", primary), getText("summaryHolidays", secondary), primary)}</div>
      <div class="summary-value">${formatBilingual(String(allHolidayCount), String(allHolidayCount), primary)}</div>
    </div>
  `;
}

function renderYearOverview(yearData) {
  if (!ui.yearProgressValue && !ui.recentItemTitle && !ui.yearTimelineEvents) {
    return;
  }
  const year = yearData && yearData.year ? yearData.year : state.currentDate.getFullYear();
  const today = state.currentDate;
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const totalDays = diffInDays(yearStart, yearEnd) + 1;
  const dayIndexRaw = diffInDays(yearStart, today) + 1;
  const dayIndex = Math.min(Math.max(dayIndexRaw, 0), totalDays);
  const ratio = totalDays ? Math.round((dayIndex / totalDays) * 100) : 0;

  if (ui.yearProgressValue) {
    ui.yearProgressValue.textContent = `${ratio}%`;
  }
  if (ui.yearTimelineProgress) {
    ui.yearTimelineProgress.style.width = `${ratio}%`;
  }
  if (ui.yearTimelineNow) {
    ui.yearTimelineNow.style.left = `${ratio}%`;
  }
  if (ui.yearProgressBadge) {
    ui.yearProgressBadge.textContent = `${dayIndex}/${totalDays}`;
  }

  const holidays = yearData && Array.isArray(yearData.holidays) ? yearData.holidays : [];
  const plans = yearData && Array.isArray(yearData.plans) ? yearData.plans : [];
  const recentItem = getRecentYearItem(plans, holidays, year, today);
  const timelineEvents = getYearTimelineEvents(plans, holidays, year, today);

  updateRecentItem(recentItem);
  renderYearTimelineEvents(timelineEvents, yearStart, totalDays);
}

function updateRecentItem(item) {
  if (!ui.recentItemTitle || !ui.recentItemMeta) {
    return;
  }
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);

  if (!item) {
    const primaryText = getText("noPlans", primary);
    const secondaryText = getText("noPlans", secondary);
    ui.recentItemTitle.innerHTML = formatBilingual(primaryText, secondaryText, primary);
    ui.recentItemMeta.textContent = "-";
    return;
  }

  const titlePrimary = escapeHtml(item.title || "-");
  const titleSecondary = escapeHtml(item.titleAlt || item.title || "-");
  ui.recentItemTitle.innerHTML = formatBilingual(titlePrimary, titleSecondary, primary);

  const datePrimary = formatShortDate(item.start, primary);
  const dateSecondary = formatShortDate(item.start, secondary);
  const metaPrimary = item.isOngoing ? getText("labelInProgress", primary) : formatDayCount(item.daysUntil, primary);
  const metaSecondary = item.isOngoing ? getText("labelInProgress", secondary) : formatDayCount(item.daysUntil, secondary);
  ui.recentItemMeta.innerHTML = formatBilingual(`${datePrimary} \u00b7 ${metaPrimary}`, `${dateSecondary} \u00b7 ${metaSecondary}`, primary);
}

function getRecentYearItem(plans, holidays, year, referenceDate) {
  const items = [...getUpcomingPlans(plans, year, referenceDate), ...getUpcomingHolidays(holidays, referenceDate)];
  if (!items.length) {
    return null;
  }
  items.sort(sortUpcomingItems);
  return items[0];
}

function getYearTimelineEvents(plans, holidays, year, referenceDate) {
  const items = [...getUpcomingPlans(plans, year, referenceDate), ...getUpcomingHolidays(holidays, referenceDate)];
  return items.sort(sortUpcomingItems).slice(0, 8);
}

function sortUpcomingItems(a, b) {
  if (a.isOngoing !== b.isOngoing) {
    return a.isOngoing ? -1 : 1;
  }
  return a.start.getTime() - b.start.getTime();
}

function renderYearTimelineEvents(events, yearStart, totalDays) {
  if (!ui.yearTimelineEvents) {
    return;
  }
  ui.yearTimelineEvents.innerHTML = events
    .map((event, index) => {
      const dayOffset = Math.min(Math.max(diffInDays(yearStart, event.start), 0), totalDays - 1);
      const position = totalDays ? (dayOffset / totalDays) * 100 : 0;
      const side = index % 2 === 0 ? "top" : "bottom";
      const title = event.titleAlt && state.language === "zh" ? event.titleAlt : event.title;
      const safeTitle = escapeHtml(title);
      const safeTitleAttr = escapeAttribute(title);
      return `
        <button class="year-timeline-event ${event.kind} ${event.tone} ${side}" style="left: ${position}%;" type="button" title="${safeTitleAttr}">
          <span class="year-timeline-dot"></span>
          <span class="year-timeline-label">${safeTitle}</span>
        </button>
      `;
    })
    .join("");
}

function getUpcomingHolidays(holidays, referenceDate) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const candidates = [];
  holidays
    .filter((holiday) => holiday && holiday.type !== "adjustment")
    .forEach((holiday) => {
      const ranges = getHolidayRanges(holiday);
      ranges.forEach((range) => {
        const daysUntilEnd = diffInDays(today, range.end);
        if (daysUntilEnd < 0) {
          return;
        }
        const daysUntilStart = diffInDays(today, range.start);
        const isOngoing = daysUntilStart <= 0 && daysUntilEnd >= 0;
        candidates.push({
          title: holiday.name || "",
          titleAlt: holiday.nameAlt || holiday.name || "",
          kind: "holiday",
          tone: holiday.type === "adjustment" ? "adjustment" : "holiday",
          start: range.start,
          daysUntil: Math.max(0, daysUntilStart),
          isOngoing
        });
      });
    });

  return candidates;
}

function getUpcomingPlans(plans, year, referenceDate) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const candidates = [];
  plans.forEach((plan, index) => {
    const ranges = getPlanRanges(plan, year);
    ranges.forEach((range) => {
      const daysUntilEnd = diffInDays(today, range.end);
      if (daysUntilEnd < 0) {
        return;
      }
      const daysUntilStart = diffInDays(today, range.start);
      const isOngoing = daysUntilStart <= 0 && daysUntilEnd >= 0;
      candidates.push({
        title: plan.title || "",
        titleAlt: plan.titleAlt || plan.title || "",
        kind: "plan",
        tone: getPlanTimelineTone(plan, index),
        start: range.start,
        daysUntil: Math.max(0, daysUntilStart),
        isOngoing
      });
    });
  });

  return candidates;
}

function getPlanTimelineTone(plan, index) {
  if (plan.priority === "high") {
    return "plan-3";
  }
  if (plan.priority === "med") {
    return "plan-2";
  }
  if (plan.priority === "low") {
    return "plan-1";
  }
  return `plan-${(index % 3) + 1}`;
}

function renderYearCards(year, primary, secondary, plansByMonth, holidaysByMonth) {
  if (!ui.yearGrid) {
    return;
  }
  ui.yearGrid.innerHTML = "";
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const card = document.createElement("div");
    card.className = "month-card";
    card.dataset.month = String(monthIndex);
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const dayCount = formatDayCount(daysInMonth, primary);
    const dayCountSecondary = formatDayCount(daysInMonth, secondary);
    const monthPlans = plansByMonth[monthIndex];
    const monthHolidays = holidaysByMonth[monthIndex];
    const planMarkup = monthPlans
      .map((plan) => {
        const primaryLabel = plan.title;
        const secondaryLabel = plan.titleAlt || plan.title;
        return `<span class="month-pill plan">${formatBilingual(primaryLabel, secondaryLabel, primary)}</span>`;
      })
      .join("");
    const holidayMarkup = monthHolidays
      .map((holiday) => {
        const primaryLabel = formatHolidayLabel(holiday, primary, holiday.name);
        const secondaryLabel = formatHolidayLabel(holiday, secondary, holiday.nameAlt || holiday.name);
        const statutoryClass = holiday.type === "statutory" ? " is-statutory" : "";
        const adjustmentClass = holiday.type === "adjustment" ? " is-adjustment" : "";
        return `<span class="month-pill holiday${statutoryClass}${adjustmentClass}">${formatBilingual(primaryLabel, secondaryLabel, primary)}</span>`;
      })
      .join("");
    const emptyPlans = `<span class="month-pill is-empty">${formatBilingual(getText("noPlans", primary), getText("noPlans", secondary), primary)}</span>`;
    const emptyHolidays = `<span class="month-pill is-empty">${formatBilingual(getText("noHolidays", primary), getText("noHolidays", secondary), primary)}</span>`;
    card.innerHTML = `
      <div class="month-title">${formatBilingual(getMonthName(monthIndex, primary), getMonthName(monthIndex, secondary), primary)}</div>
      <div class="month-meta">${formatBilingual(dayCount, dayCountSecondary, primary)}</div>
      <div class="month-section">
        <div class="month-section-title">${formatBilingual(getText("labelPlans", primary), getText("labelPlans", secondary), primary)}</div>
        <div class="month-pill-row">
          ${planMarkup || emptyPlans}
        </div>
      </div>
      <div class="month-section">
        <div class="month-section-title">${formatBilingual(getText("labelHolidays", primary), getText("labelHolidays", secondary), primary)}</div>
        <div class="month-pill-row">
          ${holidayMarkup || emptyHolidays}
        </div>
      </div>
    `;
    ui.yearGrid.appendChild(card);
  }
}

function spotlightTodayCard() {
  if (state.yearView === "heatmap") {
    const todayCell = ui.yearHeatmapGrid && ui.yearHeatmapGrid.querySelector(".heatmap-cell.is-today");
    if (todayCell) {
      todayCell.scrollIntoView({ behavior: "smooth", block: "center" });
      todayCell.classList.add("is-spotlight");
      todayCell.addEventListener("animationend", () => {
        todayCell.classList.remove("is-spotlight");
      }, { once: true });
    }
    return;
  }
  if (!ui.yearGrid) {
    return;
  }
  const todayMonth = new Date().getMonth();
  const card = ui.yearGrid.querySelector(`[data-month="${todayMonth}"]`);
  if (!card) {
    return;
  }
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("is-spotlight");
  card.addEventListener("animationend", () => {
    card.classList.remove("is-spotlight");
  }, { once: true });
}

function renderYearHeatmap(year, primary, secondary, plans, holidays) {
  if (!ui.yearHeatmapGrid || !ui.yearHeatmapMonths || !ui.yearHeatmapDays) {
    return;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const gridStart = addDays(start, -getDayIndex(start));
  const gridEnd = addDays(end, 6 - getDayIndex(end));
  const totalDays = Math.round((gridEnd - gridStart) / dayMs) + 1;
  const weeks = Math.ceil(totalDays / 7);
  const eventMap = buildYearEventMap(year, plans, holidays);

  ui.yearHeatmapGrid.innerHTML = "";
  ui.yearHeatmapGrid.style.gridTemplateColumns = `repeat(${weeks}, var(--heatmap-cell))`;
  ui.yearHeatmapMonths.innerHTML = "";
  ui.yearHeatmapMonths.style.gridTemplateColumns = `repeat(${weeks}, var(--heatmap-cell))`;
  ui.yearHeatmapDays.innerHTML = "";

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const label = document.createElement("div");
    label.className = "heatmap-day";
    if (dayIndex >= 5) {
      label.classList.add("is-weekend");
    }
    label.textContent = getDayName(dayIndex, primary);
    ui.yearHeatmapDays.appendChild(label);
  }

  let lastWeekIndex = -1;
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    const monthDate = new Date(year, monthIndex, 1);
    const weekIndex = Math.max(0, Math.floor((monthDate - gridStart) / (dayMs * 7)));
    if (weekIndex <= lastWeekIndex) {
      continue;
    }
    lastWeekIndex = weekIndex;
    const monthLabel = document.createElement("div");
    monthLabel.className = "heatmap-month-label";
    monthLabel.style.gridColumnStart = String(weekIndex + 1);
    monthLabel.innerHTML = `
      <span class="month-label-zh">${MONTH_SHORT_ZH[monthIndex]}</span>
      <span class="month-label-en">${MONTH_SHORT[monthIndex]}</span>
    `;
    ui.yearHeatmapMonths.appendChild(monthLabel);
  }

  const todayKey = formatDate(new Date());
  let cursor = new Date(gridStart);
  for (let i = 0; i < totalDays; i += 1) {
    const cell = document.createElement("div");
    cell.className = "heatmap-cell";
    const inYear = cursor.getFullYear() === year;
    if (!inYear) {
      cell.classList.add("is-outside");
    }
    const dateKey = formatDate(cursor);
    if (inYear) {
      if (dateKey === todayKey) {
        cell.classList.add("is-today");
      }
      const event = eventMap.get(dateKey);
      if (event) {
        cell.classList.add("has-event");
        cell.style.setProperty("--event-color", event.color);
        if (event.isMainDay) {
          cell.classList.add("is-holiday-day");
        }
      }
      const label = document.createElement("span");
      label.className = "heatmap-label";
      label.innerHTML = buildHeatmapLabel(cursor, event, primary, secondary);
      cell.appendChild(label);
      cell.dataset.date = dateKey;
    }
    ui.yearHeatmapGrid.appendChild(cell);
    cursor = addDays(cursor, 1);
  }

  renderYearHeatmapLegend(plans, holidays, primary, secondary);
}

function renderYearHeatmapLegend(plans, holidays, primary, secondary) {
  if (!ui.yearHeatmapLegend) {
    return;
  }
  const items = [];
  plans.forEach((plan, index) => {
    items.push({
      label: plan.title,
      labelAlt: plan.titleAlt || plan.title,
      color: getPlanHeatmapColor(plan, index)
    });
  });
  const hasHolidays = holidays.some((holiday) => holiday.type !== "adjustment");
  const hasAdjustments = holidays.some((holiday) => holiday.type === "adjustment");
  if (hasHolidays) {
    items.push({
      label: getText("labelHolidays", primary),
      labelAlt: getText("labelHolidays", secondary),
      color: "var(--event-holiday)"
    });
  }
  if (hasAdjustments) {
    const adjustmentLabel = getText("labelAdjustments", primary) || (primary === "zh" ? "\u8865\u73ed" : "Adjustments");
    const adjustmentLabelAlt = getText("labelAdjustments", secondary) || (secondary === "zh" ? "\u8865\u73ed" : "Adjustments");
    items.push({
      label: adjustmentLabel,
      labelAlt: adjustmentLabelAlt,
      color: "var(--event-adjustment)"
    });
  }
  ui.yearHeatmapLegend.innerHTML = items
    .map((item) => {
      return `
        <div class="heatmap-legend-item">
          <span class="heatmap-legend-swatch" style="--legend-color: ${item.color};"></span>
          ${formatBilingual(item.label, item.labelAlt, primary)}
        </div>
      `;
    })
    .join("");
}

function buildYearEventMap(year, plans, holidays) {
  const eventMap = new Map();
  const priority = {
    plan: 1,
    holiday: 2,
    statutory: 2,
    observance: 2,
    adjustment: 2
  };
  plans.forEach((plan, index) => {
    const color = getPlanHeatmapColor(plan, index);
    const ranges = getPlanRanges(plan, year);
    ranges.forEach((range) => {
      let current = new Date(range.start);
      while (current <= range.end) {
        if (current.getFullYear() === year) {
          const key = formatDate(current);
          setEventForDate(eventMap, key, {
            type: "plan",
            title: plan.title,
            titleAlt: plan.titleAlt || plan.title,
            color
          }, priority);
        }
        current = addDays(current, 1);
      }
    });
  });
  holidays.forEach((holiday) => {
    const ranges = getHolidayRanges(holiday);
    if (!ranges.length) {
      return;
    }
    const holidayType = priority[holiday.type] ? holiday.type : "holiday";
    const color = getHolidayColor(holiday);
    const mainDateKey = holiday.date ? formatDate(parseDate(holiday.date)) : "";
    ranges.forEach((range) => {
      let current = new Date(range.start);
      while (current <= range.end) {
        if (current.getFullYear() === year) {
          const key = formatDate(current);
          const isMainDay = holidayType !== "adjustment" && mainDateKey && key === mainDateKey;
          setEventForDate(eventMap, key, {
            type: holidayType,
            title: holiday.name,
            titleAlt: holiday.nameAlt || holiday.name,
            color,
            isMainDay
          }, priority);
        }
        current = addDays(current, 1);
      }
    });
  });
  return eventMap;
}

function setEventForDate(eventMap, dateKey, event, priority) {
  const existing = eventMap.get(dateKey);
  const nextPriority = priority[event.type] ?? 0;
  const currentPriority = existing ? (priority[existing.type] ?? 0) : -1;
  if (!existing || nextPriority > currentPriority) {
    eventMap.set(dateKey, event);
  }
}

function getPlanRanges(plan, year) {
  if (plan.startDate && plan.endDate) {
    return [
      {
        start: parseDate(plan.startDate),
        end: parseDate(plan.endDate)
      }
    ];
  }
  const rawMonths = Array.isArray(plan.months) ? plan.months : [];
  const months = [...new Set(rawMonths)]
    .map((month) => Number(month))
    .filter((month) => month >= 1 && month <= 12)
    .sort((a, b) => a - b);
  if (!months.length) {
    return [];
  }
  const ranges = [];
  let rangeStart = months[0];
  let previous = months[0];
  for (let i = 1; i < months.length; i += 1) {
    const month = months[i];
    if (month === previous + 1) {
      previous = month;
      continue;
    }
    ranges.push({
      start: new Date(year, rangeStart - 1, 1),
      end: new Date(year, previous, 0)
    });
    rangeStart = month;
    previous = month;
  }
  ranges.push({
    start: new Date(year, rangeStart - 1, 1),
    end: new Date(year, previous, 0)
  });
  return ranges;
}

function getPlanHeatmapColor(plan, index) {
  if (plan.color) {
    return plan.color;
  }
  return PLAN_HEATMAP_COLORS[index % PLAN_HEATMAP_COLORS.length];
}

function getHolidayRanges(holiday) {
  const startValue = holiday.startDate || holiday.date;
  const endValue = holiday.endDate || holiday.startDate || holiday.date;
  if (!startValue || !endValue) {
    return [];
  }
  return [
    {
      start: parseDate(startValue),
      end: parseDate(endValue)
    }
  ];
}

function getHolidayColor(holiday) {
  if (holiday.color) {
    return holiday.color;
  }
  if (holiday.type === "adjustment") {
    return "var(--event-adjustment)";
  }
  return "var(--event-holiday)";
}

function getEventTypeLabel(type, lang) {
  if (type === "plan") {
    return getText("labelPlans", lang);
  }
  if (type === "adjustment") {
    return getText("labelAdjustments", lang);
  }
  return getText("labelHolidays", lang);
}

function buildHeatmapLabel(date, event, primary, secondary) {
  const dateMarkup = formatBilingual(formatShortDate(date, primary), formatShortDate(date, secondary), primary);
  if (!event) {
    return `<span class="heatmap-label-date">${dateMarkup}</span>`;
  }
  const titleMarkup = formatBilingual(escapeHtml(event.title), escapeHtml(event.titleAlt), primary);
  const typeMarkup = formatBilingual(getEventTypeLabel(event.type, primary), getEventTypeLabel(event.type, secondary), primary);
  return `
    <span class="heatmap-label-date">${dateMarkup}</span>
    <span class="heatmap-label-title">${titleMarkup}</span>
    <span class="heatmap-label-meta">${typeMarkup}</span>
  `;
}

function renderMonthView(tasks) {
  const date = state.currentDate;
  const month = date.getMonth();
  const year = date.getFullYear();
  const start = new Date(year, month, 1);
  const startIndex = (start.getDay() + 6) % 7;
  const gridStart = addDays(start, -startIndex);
  const totalCells = 42;
  const tasksByDate = groupByDate(tasks);
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);

  ui.monthGrid.innerHTML = "";
  for (let i = 0; i < totalCells; i += 1) {
    const current = addDays(gridStart, i);
    const currentKey = formatDate(current);
    const dayTasks = tasksByDate[currentKey] || [];
    const isOutside = current.getMonth() !== month;
    const heat = Math.min(dayTasks.length, 4);

    const dayCell = document.createElement("div");
    dayCell.className = `month-day heat-${heat}${isOutside ? " is-outside" : ""}`;
    dayCell.dataset.date = currentKey;
    const extraCount = dayTasks.length - 2;
    const morePill =
      extraCount > 0
        ? `<span class="task-pill is-bilingual">${formatBilingual(formatMoreLabel(extraCount, primary), formatMoreLabel(extraCount, secondary), primary)}</span>`
        : "";
    dayCell.innerHTML = `
      <div class="day-number">${current.getDate()}</div>
      <div class="task-list">
        ${dayTasks
          .slice(0, 2)
          .map((task) => renderTaskPill(task))
          .join("")}
        ${morePill}
      </div>
    `;
    ui.monthGrid.appendChild(dayCell);
  }
}

function renderWeekView(tasks) {
  const weekStart = getWeekStart(state.currentDate);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  buildScheduleGrid(ui.weekGrid, days, tasks);
}

function renderDayView(tasks) {
  const day = state.currentDate;
  buildScheduleGrid(ui.dayGrid, [day], tasks);
}

function buildScheduleGrid(container, days, tasks) {
  const trackHeight = (DAY_END - DAY_START) * HOUR_HEIGHT;
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);
  container.style.setProperty("--hour-height", `${HOUR_HEIGHT}px`);
  container.style.setProperty("--track-height", `${trackHeight}px`);
  container.innerHTML = "";

  const timeRail = document.createElement("div");
  timeRail.className = "time-rail";
  for (let hour = DAY_START; hour <= DAY_END; hour += 1) {
    const label = document.createElement("div");
    label.className = "time-label";
    label.style.top = `${(hour - DAY_START) * HOUR_HEIGHT}px`;
    label.textContent = `${String(hour).padStart(2, "0")}:00`;
    timeRail.appendChild(label);
  }
  container.appendChild(timeRail);

  const tasksByDate = groupByDate(tasks);
  days.forEach((day) => {
    const column = document.createElement("div");
    column.className = "day-column";
    column.dataset.date = formatDate(day);
    const header = document.createElement("div");
    header.className = "day-header";
    header.innerHTML = formatBilingual(formatDayHeader(day, primary), formatDayHeader(day, secondary), primary);
    const track = document.createElement("div");
    track.className = "day-track";

    const dayTasks = tasksByDate[formatDate(day)] || [];
    dayTasks.forEach((task) => {
      if (!task.start || !task.end) {
        return;
      }
      const start = toHourValue(task.start);
      const end = toHourValue(task.end);
      const clampedStart = Math.max(start, DAY_START);
      const clampedEnd = Math.min(end, DAY_END);
      const top = (clampedStart - DAY_START) * HOUR_HEIGHT;
      const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 28);

      const block = document.createElement("div");
      const priority = task.priority || "med";
      block.className = `task-block priority-${priority}${task.completed ? " is-done" : ""}`;
      if (task.id) {
        block.dataset.taskId = task.id;
      }
      block.style.top = `${top}px`;
      block.style.height = `${height}px`;
      const titleMarkup = task.titleAlt ? formatBilingual(escapeHtml(task.title), escapeHtml(task.titleAlt), primary) : escapeHtml(task.title);
      const checkedClass = task.completed ? " is-checked" : "";
      block.innerHTML = `
        <button class="task-check${checkedClass}" data-task-id="${escapeAttribute(task.id)}" type="button" aria-label="Toggle complete"></button>
        <div class="task-title">${titleMarkup}</div>
        <div class="task-time">${escapeHtml(task.start)} - ${escapeHtml(task.end)}</div>
      `;
      track.appendChild(block);
    });

    column.appendChild(header);
    column.appendChild(track);
    container.appendChild(column);
  });
}

function renderTaskPill(task) {
  const priority = task.priority || "med";
  const titleMarkup = task.titleAlt ? formatBilingual(escapeHtml(task.title), escapeHtml(task.titleAlt), state.language) : escapeHtml(task.title);
  const taskIdAttr = task.id ? ` data-task-id="${escapeAttribute(task.id)}"` : "";
  const checkedClass = task.completed ? " is-checked" : "";
  const doneClass = task.completed ? " is-done" : "";
  return `
    <div class="task-pill priority-${priority}${doneClass}"${taskIdAttr}>
      <button class="task-check${checkedClass}" data-task-id="${escapeAttribute(task.id)}" type="button" aria-label="Toggle complete"></button>
      <span class="task-label">${titleMarkup}</span>
    </div>
  `;
}

function applyFilters(tasks) {
  return tasks.filter((task) => {
    if (state.filterTag !== "all") {
      if (!task.tag || task.tag !== state.filterTag) {
        return false;
      }
    }
    if (state.filterStatus === "open" && task.completed === true) {
      return false;
    }
    if (state.filterStatus === "done" && task.completed !== true) {
      return false;
    }
    return true;
  });
}

function toggleTaskCompletion(taskId) {
  if (!taskId || state.isReadOnly) {
    return;
  }
  const storedIndex = state.storedTasks.findIndex((t) => t.id === taskId);
  if (storedIndex >= 0) {
    state.storedTasks[storedIndex].completed = !state.storedTasks[storedIndex].completed;
    saveTasks(state.storedTasks);
    invalidateTodayCache();
    const key = state.storedTasks[storedIndex].completed ? "toastTaskCompleted" : "toastTaskReopened";
    showToast(getText(key, state.language), { type: "success" });
    renderAll();
    return;
  }
  // For JSON-source tasks, we store a copy in storedTasks with toggled state
  const allItems = [...(state.todayTasks || []), ...(state.tasks || [])];
  const task = allItems.find((t) => t.id === taskId);
  if (task) {
    const copy = normalizeTask({ ...task, completed: !task.completed, source: "user" });
    state.storedTasks.unshift(copy);
    state.storedTasks = sortTasksByDateTime(state.storedTasks);
    saveTasks(state.storedTasks);
    invalidateTodayCache();
    const key = copy.completed ? "toastTaskCompleted" : "toastTaskReopened";
    showToast(getText(key, state.language), { type: "success" });
    renderAll();
  }
}

function saveTaskFromForm() {
  const title = ui.taskTitle.value.trim();
  if (!title) {
    showToast(getText("statusTitleRequired", state.language), { type: "error" });
    return;
  }
  if (ui.taskEnd.value <= ui.taskStart.value) {
    showToast(getText("statusEndTimeInvalid", state.language), { type: "error" });
    return;
  }

  const task = normalizeTask({
    id: ui.taskId.value || randomId(),
    title,
    date: ui.taskDate.value,
    start: ui.taskStart.value,
    end: ui.taskEnd.value,
    priority: ui.taskPriority.value,
    tag: ui.taskTag.value,
    notes: ui.taskNotes.value.trim(),
    completed: ui.taskCompleted.checked
  });

  const existingIndex = state.storedTasks.findIndex((item) => item.id === task.id);
  if (existingIndex >= 0) {
    state.storedTasks[existingIndex] = task;
  } else {
    state.storedTasks.unshift(task);
  }

  state.storedTasks = sortTasksByDateTime(state.storedTasks);
  saveTasks(state.storedTasks);
  invalidateTodayCache();
  closeModal();
  renderAll();
  showToast(getText("statusTaskSaved", state.language), { type: "success" });
}

function openModal(task) {
  ui.modal.classList.add("is-open");
  ui.modal.setAttribute("aria-hidden", "false");
  const canEdit = !state.isReadOnly;
  if (task) {
    setModalTitle("modalEditTitle");
    ui.taskId.value = task.id;
    ui.taskTitle.value = task.title;
    ui.taskDate.value = task.date;
    ui.taskStart.value = task.start;
    ui.taskEnd.value = task.end;
    ui.taskPriority.value = task.priority;
    ui.taskTag.value = task.tag;
    ui.taskNotes.value = task.notes || "";
    ui.taskCompleted.checked = Boolean(task.completed);
    const canDelete = canEdit && task.source === "user";
    ui.deleteTask.style.display = canDelete ? "inline-flex" : "none";
  } else {
    const defaultTask = getDefaultTaskConfig();
    setModalTitle("modalAddTitle");
    ui.taskId.value = "";
    ui.taskTitle.value = "";
    ui.taskDate.value = formatDate(state.currentDate);
    ui.taskStart.value = defaultTask.start;
    ui.taskEnd.value = defaultTask.end;
    ui.taskPriority.value = defaultTask.priority;
    ui.taskTag.value = defaultTask.tag;
    ui.taskNotes.value = "";
    ui.taskCompleted.checked = false;
    ui.deleteTask.style.display = "none";
  }
}

function deleteTaskById(taskId) {
  if (!taskId) {
    return;
  }
  const nextTasks = state.storedTasks.filter((task) => task.id !== taskId);
  if (nextTasks.length === state.storedTasks.length) {
    setStatusKey("statusReadOnly");
    return;
  }
  state.storedTasks = nextTasks;
  saveTasks(state.storedTasks);
  invalidateTodayCache();
  closeModal();
  renderAll();
  showToast(getText("statusTaskDeleted", state.language), { type: "success" });
}

function closeModal() {
  ui.modal.classList.remove("is-open");
  ui.modal.setAttribute("aria-hidden", "true");
}

function loadTasks() {
  try {
    return readStoredTasks();
  } catch (error) {
    const seeded = seedTasks(state.currentDate);
    saveTasks(seeded);
    return seeded;
  }
}

function saveTasks(tasks) {
  try {
    writeStoredTasks(tasks);
  } catch (error) {
    showToast(getText("statusStorageUnavailable", state.language), { type: "error" });
  }
}

function invalidateTodayCache() {
  state.todayCacheKey = "";
  state.todayTasks = [];
}

document.addEventListener("DOMContentLoaded", init);
