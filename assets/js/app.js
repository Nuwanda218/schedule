import {
  I18N,
  formatBilingual,
  getSecondaryLanguage,
  getText,
  loadLanguage,
  saveLanguage
} from "./modules/i18n.js";
import {
  getSeasonThemePath,
  loadSeason,
  normalizeSeason,
  saveSeason
} from "./modules/theme.js";
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
  MONTH_NAMES,
  MONTH_SLUGS,
  DATA_ROOT,
  QUOTES_PATH,
  MONTH_SHORT,
  DAY_NAMES,
  MONTH_NAMES_ZH,
  MONTH_SHORT_ZH,
  DAY_NAMES_ZH,
  LANG_NAMES
} from "./core/constants.js";
import {
  createTask,
  readStoredTasks,
  seedTasks,
  writeStoredTasks
} from "./core/storage.js";

const TAG_LABELS = {
  en: {
    studio: I18N.en.tagStudio,
    admin: I18N.en.tagAdmin,
    health: I18N.en.tagHealth,
    learning: I18N.en.tagLearning,
    travel: I18N.en.tagTravel
  },
  zh: {
    studio: I18N.zh.tagStudio,
    admin: I18N.zh.tagAdmin,
    health: I18N.zh.tagHealth,
    learning: I18N.zh.tagLearning,
    travel: I18N.zh.tagTravel
  }
};

const PLAN_HEATMAP_COLORS = ["var(--event-plan-1)", "var(--event-plan-2)", "var(--event-plan-3)"];

const dataCache = new Map();

const state = {
  view: "year",
  currentDate: new Date(),
  filterTag: "all",
  filterStatus: "all",
  language: DEFAULT_LANGUAGE,
  season: DEFAULT_SEASON,
  statusKey: "statusReady",
  isReadOnly: true,
  yearView: "cards",
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
  tasks: []
};

const ui = {};

async function init() {
  cacheElements();
  state.language = loadLanguage();
  state.season = loadSeason();
  bindUI();
  applySeason(state.season);
  applyTheme(ui.themeToggle ? ui.themeToggle.getAttribute("value") || "light" : "light");
  setView(state.view);
  setYearView(state.yearView);
  await loadScheduleDataForCurrentDate();
  applyLanguage(false);
  renderAll();
  document.body.classList.add("is-loaded");
}

function cacheElements() {
  ui.viewButtons = document.querySelectorAll(".view-switch .view-btn");
  ui.viewPanels = document.querySelectorAll(".view-panel");
  ui.rangeLabel = document.getElementById("rangeLabel");
  ui.yearGrid = document.getElementById("yearGrid");
  ui.yearSummary = document.getElementById("yearSummary");
  ui.monthGrid = document.getElementById("monthGrid");
  ui.weekGrid = document.getElementById("weekGrid");
  ui.dayGrid = document.getElementById("dayGrid");
  ui.progressRing = document.getElementById("progressRing");
  ui.progressBarFill = document.getElementById("progressBarFill");
  ui.statCompletion = document.getElementById("statCompletion");
  ui.statTotal = document.getElementById("statTotal");
  ui.statToday = document.getElementById("statToday");
  ui.statTopTag = document.getElementById("statTopTag");
  ui.statWeekRange = document.getElementById("statWeekRange");
  ui.todayBadge = document.getElementById("todayBadge");
  ui.todayList = document.getElementById("todayList");
  ui.todayEmpty = document.getElementById("todayEmpty");
  ui.todayQuote = document.getElementById("todayQuote");
  ui.todayQuoteSource = document.getElementById("todayQuoteSource");
  ui.todayQuoteButton = document.getElementById("todayQuoteButton");
  ui.yearProgressValue = document.getElementById("yearProgressValue");
  ui.yearProgressFill = document.getElementById("yearProgressFill");
  ui.yearProgressBadge = document.getElementById("yearProgressBadge");
  ui.nextHolidayTitle = document.getElementById("nextHolidayTitle");
  ui.nextHolidayMeta = document.getElementById("nextHolidayMeta");
  ui.nextPlanTitle = document.getElementById("nextPlanTitle");
  ui.nextPlanMeta = document.getElementById("nextPlanMeta");
  ui.statusMessage = document.getElementById("statusMessage");
  ui.importButton = document.getElementById("importButton");
  ui.exportButton = document.getElementById("exportButton");
  ui.exportImageButton = document.getElementById("exportImageButton");
  ui.importFile = document.getElementById("importFile");
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

function bindUI() {
  ui.viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
      renderAll();
    });
  });

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
  });

  document.querySelector('[data-action="add"]').addEventListener("click", () => {
    if (state.isReadOnly) {
      setStatusKey("statusReadOnly");
      return;
    }
    openModal();
  });

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
      updateCurrentDate(parseDate(dateValue), "day");
    }
  });

  document.addEventListener("click", (event) => {
    const taskTarget = event.target.closest("[data-task-id]");
    if (!taskTarget) {
      return;
    }
    const task = getActiveItems().find((item) => item.id === taskTarget.dataset.taskId);
    if (task) {
      openModal(task);
    }
  });

  if (ui.importButton && ui.importFile) {
    ui.importButton.addEventListener("click", () => {
      if (state.isReadOnly) {
        setStatusKey("statusReadOnly");
        return;
      }
      ui.importFile.click();
    });
    ui.importFile.addEventListener("change", handleImport);
  }

  if (ui.exportButton) {
    ui.exportButton.addEventListener("click", exportTasks);
  }

  if (ui.exportImageButton) {
    ui.exportImageButton.addEventListener("click", () => {
      setStatusKey("statusImagePlaceholder");
    });
  }

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
}

function applyLanguage(shouldRender = true) {
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);

  document.documentElement.setAttribute("lang", primary);

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
  refreshStatus();

  if (shouldRender) {
    renderAll();
  }
}

function toggleSettingsPanel(forceOpen) {
  if (!ui.cornerControls || !ui.settingsToggle || !ui.settingsPanel) {
    return;
  }
  const isOpen = ui.cornerControls.classList.contains("is-open");
  const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;
  ui.cornerControls.classList.toggle("is-open", nextOpen);
  ui.settingsToggle.setAttribute("aria-expanded", String(nextOpen));
  ui.settingsPanel.setAttribute("aria-hidden", String(!nextOpen));
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
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);
  const primaryText = getText(key, primary);
  const secondaryText = getText(key, secondary);
  if (!primaryText || !secondaryText) {
    setStatus(primaryText || "");
    return;
  }
  setStatus(formatBilingual(primaryText, secondaryText, primary));
}

function refreshStatus() {
  if (!state.statusKey) {
    return;
  }
  setStatusKey(state.statusKey);
}

function getMonthSlug(monthIndex) {
  return MONTH_SLUGS[monthIndex] || "month";
}

function getYearPath(year) {
  return `${DATA_ROOT}/${year}/year.json`;
}

function getMonthPath(year, monthIndex) {
  const monthSlug = getMonthSlug(monthIndex);
  return `${DATA_ROOT}/${year}/${monthSlug}/${monthSlug}.json`;
}

function getWeekPath(year, monthIndex, weekIndex) {
  const monthSlug = getMonthSlug(monthIndex);
  return `${DATA_ROOT}/${year}/${monthSlug}/week${weekIndex}/week.json`;
}

function getDayPath(year, monthIndex, weekIndex) {
  const monthSlug = getMonthSlug(monthIndex);
  return `${DATA_ROOT}/${year}/${monthSlug}/week${weekIndex}/day.json`;
}

async function fetchJson(path) {
  if (dataCache.has(path)) {
    return dataCache.get(path);
  }
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load ${path}`);
    }
    const data = await response.json();
    dataCache.set(path, data);
    return data;
  } catch (error) {
    return null;
  }
}

function normalizeItems(items, prefix, defaultDate) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item, index) => {
    const safe = item && typeof item === "object" ? item : {};
    return {
      id: safe.id || `${prefix}-${index + 1}`,
      title: safe.title || "Untitled",
      titleAlt: safe.titleAlt || "",
      date: safe.date || defaultDate || "",
      start: safe.start || "",
      end: safe.end || "",
      priority: safe.priority || "med",
      tag: safe.tag || "",
      notes: safe.notes || "",
      completed: Boolean(safe.completed)
    };
  });
}

function normalizeHoliday(holiday, index) {
  const safe = holiday && typeof holiday === "object" ? holiday : {};
  const dateValue = safe.date || safe.startDate || "";
  return {
    id: safe.id || `holiday-${index + 1}`,
    date: dateValue,
    startDate: safe.startDate || "",
    endDate: safe.endDate || "",
    name: safe.name || "Holiday",
    nameAlt: safe.nameAlt || "",
    type: safe.type || "statutory",
    color: safe.color || ""
  };
}

function normalizePlan(plan, index) {
  const safe = plan && typeof plan === "object" ? plan : {};
  const months = Array.isArray(safe.months)
    ? safe.months
    : typeof safe.month === "number"
      ? [safe.month]
      : typeof safe.startMonth === "number" && typeof safe.endMonth === "number"
        ? Array.from({ length: safe.endMonth - safe.startMonth + 1 }, (_, i) => safe.startMonth + i)
        : [];
  return {
    id: safe.id || `plan-${index + 1}`,
    title: safe.title || "Plan",
    titleAlt: safe.titleAlt || "",
    months,
    startDate: safe.startDate || "",
    endDate: safe.endDate || "",
    notes: safe.notes || "",
    color: safe.color || ""
  };
}

function normalizeYearData(data, year) {
  const safe = data && typeof data === "object" ? data : {};
  return {
    year: safe.year || year,
    title: safe.title || "",
    holidays: Array.isArray(safe.holidays) ? safe.holidays.map(normalizeHoliday) : [],
    plans: Array.isArray(safe.plans) ? safe.plans.map(normalizePlan) : []
  };
}

function normalizeMonthData(data, year, monthIndex) {
  const safe = data && typeof data === "object" ? data : {};
  return {
    year: safe.year || year,
    month: typeof safe.month === "number" ? safe.month : monthIndex + 1,
    title: safe.title || "",
    items: normalizeItems(safe.items, "month")
  };
}

function normalizeWeekData(data, year, monthIndex, weekIndex) {
  const safe = data && typeof data === "object" ? data : {};
  return {
    year: safe.year || year,
    month: typeof safe.month === "number" ? safe.month : monthIndex + 1,
    week: typeof safe.week === "number" ? safe.week : weekIndex,
    items: normalizeItems(safe.items, "week")
  };
}

function normalizeDayData(data, year, monthIndex, weekIndex) {
  const safe = data && typeof data === "object" ? data : {};
  const days = Array.isArray(safe.days)
    ? safe.days.map((day, index) => {
        const entry = day && typeof day === "object" ? day : {};
        const entryDate = entry.date || "";
        return {
          date: entryDate,
          items: normalizeItems(entry.items, `day-${index + 1}`, entryDate)
        };
      })
    : Array.isArray(safe.items)
      ? [
          {
            date: safe.date || "",
            items: normalizeItems(safe.items, "day", safe.date || "")
          }
        ]
      : [];
  return {
    year: safe.year || year,
    month: typeof safe.month === "number" ? safe.month : monthIndex + 1,
    week: typeof safe.week === "number" ? safe.week : weekIndex,
    days
  };
}

async function loadScheduleDataForCurrentDate() {
  const year = state.currentDate.getFullYear();
  const monthIndex = state.currentDate.getMonth();
  const weekIndex = getWeekIndex(state.currentDate);
  const [yearData, monthData, weekData, dayData] = await Promise.all([
    fetchJson(getYearPath(year)),
    fetchJson(getMonthPath(year, monthIndex)),
    fetchJson(getWeekPath(year, monthIndex, weekIndex)),
    fetchJson(getDayPath(year, monthIndex, weekIndex))
  ]);
  state.data.year = normalizeYearData(yearData, year);
  state.data.month = normalizeMonthData(monthData, year, monthIndex);
  state.data.week = normalizeWeekData(weekData, year, monthIndex, weekIndex);
  state.data.day = normalizeDayData(dayData, year, monthIndex, weekIndex);
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
  return state.data.month && Array.isArray(state.data.month.items) ? state.data.month.items : [];
}

function getWeekItems() {
  return state.data.week && Array.isArray(state.data.week.items) ? state.data.week.items : [];
}

function getDayItems() {
  if (!state.data.day || !Array.isArray(state.data.day.days)) {
    return [];
  }
  const dateKey = formatDate(state.currentDate);
  const entry = state.data.day.days.find((day) => day.date === dateKey);
  if (entry && Array.isArray(entry.items)) {
    return entry.items;
  }
  return [];
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

function getStatsItems() {
  if (state.view === "year") {
    return state.data.year && Array.isArray(state.data.year.plans) ? state.data.year.plans : [];
  }
  if (state.view === "month") {
    return getMonthItems();
  }
  if (state.view === "week") {
    return getWeekItems();
  }
  return getDayItems();
}

function renderAll() {
  renderYearView(state.data.year);
  renderYearOverview(state.data.year);
  renderTodayPanel();
  renderMonthView(applyFilters(getMonthItems()));
  renderWeekView(applyFilters(getWeekItems()));
  renderDayView(applyFilters(getDayItems()));
  updateRangeLabel();
  const statsItems = applyFilters(getStatsItems());
  updateStats(statsItems);
  state.tasks = getActiveItems();
}

function setView(view) {
  state.view = view;
  ui.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  ui.viewPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.viewPanel === view);
  });
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

function updateRangeLabel() {
  const date = state.currentDate;
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);
  const primaryText = formatRangeLabelForLang(date, state.view, primary);
  const secondaryText = formatRangeLabelForLang(date, state.view, secondary);
  ui.rangeLabel.innerHTML = formatBilingual(primaryText, secondaryText, primary);
}

function updateStats(tasks) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed).length;
  const ratio = total ? Math.round((done / total) * 100) : 0;
  const todayKey = formatDate(state.currentDate);
  const openToday = tasks.filter((task) => task.date === todayKey && !task.completed).length;
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);
  if (ui.statCompletion) {
    ui.statCompletion.textContent = `${ratio}%`;
  }
  if (ui.statTotal) {
    ui.statTotal.textContent = total;
  }
  if (ui.statToday) {
    ui.statToday.textContent = openToday;
  }
  if (ui.statTopTag) {
    ui.statTopTag.innerHTML = formatBilingual(getTopTag(tasks, primary), getTopTag(tasks, secondary), primary);
  }
  if (ui.progressBarFill) {
    ui.progressBarFill.style.width = `${ratio}%`;
  }
  if (ui.progressRing) {
    ui.progressRing.style.background = `conic-gradient(var(--accent) ${ratio * 3.6}deg, var(--progress-ring-track) 0deg)`;
  }
  const weekStart = getWeekStart(state.currentDate);
  if (ui.statWeekRange) {
    ui.statWeekRange.innerHTML = formatBilingual(formatWeekRangeLabel(weekStart, primary), formatWeekRangeLabel(weekStart, secondary), primary);
  }
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
    })
    .catch(() => {
      renderTodayItems([]);
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
    if (ui.todayQuoteButton) {
      ui.todayQuoteButton.hidden = false;
    }
    renderTodayQuote(false);
    return;
  }
  ui.todayEmpty.hidden = true;
  ui.todayList.hidden = false;
  if (ui.todayQuoteButton) {
    ui.todayQuoteButton.hidden = true;
  }
  const sorted = [...tasks].sort((a, b) => getTimeSortValue(a) - getTimeSortValue(b));
  ui.todayList.innerHTML = sorted
    .map((task) => {
      const titlePrimary = task.title || "-";
      const titleSecondary = task.titleAlt || task.title || "-";
      const timeLabel = formatTimeRange(task);
      const doneClass = task.completed ? " is-done" : "";
      return `<li class="today-item${doneClass}"><span class="today-time">${timeLabel}</span><span class="today-title">${formatBilingual(titlePrimary, titleSecondary, primary)}</span></li>`;
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
  const year = today.getFullYear();
  const monthIndex = today.getMonth();
  const weekIndex = getWeekIndex(today);
  const dayData = await fetchJson(getDayPath(year, monthIndex, weekIndex));
  const normalized = normalizeDayData(dayData, year, monthIndex, weekIndex);
  const items = getDayItemsFromData(normalized, todayKey);
  state.todayCacheKey = todayKey;
  state.todayTasks = items;
  return items;
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
  return fetchJson(QUOTES_PATH).then((data) => {
    const quotes = data && Array.isArray(data.quotes) ? data.quotes : [];
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
  if (!ui.yearProgressValue && !ui.nextHolidayTitle && !ui.nextPlanTitle) {
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
  if (ui.yearProgressFill) {
    ui.yearProgressFill.style.width = `${ratio}%`;
  }
  if (ui.yearProgressBadge) {
    ui.yearProgressBadge.textContent = `${dayIndex}/${totalDays}`;
  }

  const holidays = yearData && Array.isArray(yearData.holidays) ? yearData.holidays : [];
  const plans = yearData && Array.isArray(yearData.plans) ? yearData.plans : [];
  const nextHoliday = getNextHoliday(holidays, today);
  const nextPlan = getNextPlan(plans, year, today);

  updateOverviewCard(nextHoliday, ui.nextHolidayTitle, ui.nextHolidayMeta, "noHolidays");
  updateOverviewCard(nextPlan, ui.nextPlanTitle, ui.nextPlanMeta, "noPlans");
}

function updateOverviewCard(item, titleEl, metaEl, emptyKey) {
  if (!titleEl || !metaEl) {
    return;
  }
  const primary = state.language;
  const secondary = getSecondaryLanguage(primary);

  if (!item) {
    const primaryText = getText(emptyKey, primary);
    const secondaryText = getText(emptyKey, secondary);
    titleEl.innerHTML = formatBilingual(primaryText, secondaryText, primary);
    metaEl.textContent = "-";
    return;
  }

  const titlePrimary = item.title || "-";
  const titleSecondary = item.titleAlt || item.title || "-";
  titleEl.innerHTML = formatBilingual(titlePrimary, titleSecondary, primary);

  const datePrimary = formatShortDate(item.start, primary);
  const dateSecondary = formatShortDate(item.start, secondary);
  const metaPrimary = item.isOngoing ? getText("labelInProgress", primary) : formatDayCount(item.daysUntil, primary);
  const metaSecondary = item.isOngoing ? getText("labelInProgress", secondary) : formatDayCount(item.daysUntil, secondary);
  metaEl.innerHTML = formatBilingual(`${datePrimary} \u00b7 ${metaPrimary}`, `${dateSecondary} \u00b7 ${metaSecondary}`, primary);
}

function getNextHoliday(holidays, referenceDate) {
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
          start: range.start,
          daysUntil: Math.max(0, daysUntilStart),
          isOngoing
        });
      });
    });

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => {
    if (a.isOngoing !== b.isOngoing) {
      return a.isOngoing ? -1 : 1;
    }
    return a.start.getTime() - b.start.getTime();
  });

  return candidates[0];
}

function getNextPlan(plans, year, referenceDate) {
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const candidates = [];
  plans.forEach((plan) => {
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
        start: range.start,
        daysUntil: Math.max(0, daysUntilStart),
        isOngoing
      });
    });
  });

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => {
    if (a.isOngoing !== b.isOngoing) {
      return a.isOngoing ? -1 : 1;
    }
    return a.start.getTime() - b.start.getTime();
  });

  return candidates[0];
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
  const titleMarkup = formatBilingual(event.title, event.titleAlt, primary);
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
      const titleMarkup = task.titleAlt ? formatBilingual(task.title, task.titleAlt, primary) : task.title;
      block.innerHTML = `
        <div class="task-title">${titleMarkup}</div>
        <div class="task-time">${task.start} - ${task.end}</div>
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
  const titleMarkup = task.titleAlt ? formatBilingual(task.title, task.titleAlt, state.language) : task.title;
  const taskIdAttr = task.id ? ` data-task-id="${task.id}"` : "";
  return `
    <div class="task-pill priority-${priority}"${taskIdAttr}>
      <span class="task-dot"></span>
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

function saveTaskFromForm() {
  const title = ui.taskTitle.value.trim();
  if (!title) {
    setStatusKey("statusTitleRequired");
    return;
  }
  if (ui.taskEnd.value <= ui.taskStart.value) {
    setStatusKey("statusEndTimeInvalid");
    return;
  }

  const task = {
    id: ui.taskId.value || randomId(),
    title,
    date: ui.taskDate.value,
    start: ui.taskStart.value,
    end: ui.taskEnd.value,
    priority: ui.taskPriority.value,
    tag: ui.taskTag.value,
    notes: ui.taskNotes.value.trim(),
    completed: ui.taskCompleted.checked
  };

  const existingIndex = state.tasks.findIndex((item) => item.id === task.id);
  if (existingIndex >= 0) {
    state.tasks[existingIndex] = task;
  } else {
    state.tasks.unshift(task);
  }

  saveTasks(state.tasks);
  closeModal();
  renderAll();
  setStatusKey("statusTaskSaved");
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
    ui.deleteTask.style.display = canEdit ? "inline-flex" : "none";
  } else {
    setModalTitle("modalAddTitle");
    ui.taskId.value = "";
    ui.taskTitle.value = "";
    ui.taskDate.value = formatDate(state.currentDate);
    ui.taskStart.value = "09:00";
    ui.taskEnd.value = "10:00";
    ui.taskPriority.value = "med";
    ui.taskTag.value = "studio";
    ui.taskNotes.value = "";
    ui.taskCompleted.checked = false;
    ui.deleteTask.style.display = "none";
  }
}

function closeModal() {
  ui.modal.classList.remove("is-open");
  ui.modal.setAttribute("aria-hidden", "true");
}

function handleImport(event) {
  if (state.isReadOnly) {
    setStatusKey("statusReadOnly");
    ui.importFile.value = "";
    return;
  }
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  file
    .text()
    .then((text) => {
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.tasks)) {
        throw new Error("Invalid format");
      }
      state.tasks = data.tasks.map((task) => ({
        id: task.id || randomId(),
        title: task.title || "Untitled",
        date: task.date || formatDate(new Date()),
        start: task.start || "09:00",
        end: task.end || "10:00",
        priority: task.priority || "med",
        tag: task.tag || "studio",
        notes: task.notes || "",
        completed: Boolean(task.completed)
      }));
      saveTasks(state.tasks);
      renderAll();
      setStatusKey("statusImportComplete");
    })
    .catch(() => {
      setStatusKey("statusImportFailed");
    })
    .finally(() => {
      ui.importFile.value = "";
    });
}

function exportTasks() {
  if (state.isReadOnly) {
    setStatusKey("statusReadOnly");
    return;
  }
  const payload = {
    tasks: state.tasks
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "schedule-studio.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatusKey("statusExportReady");
}

function setStatus(message) {
  if (!ui.statusMessage) {
    return;
  }
  ui.statusMessage.innerHTML = message;
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
    setStatusKey("statusStorageUnavailable");
  }
}

function groupByDate(tasks) {
  return tasks.reduce((acc, task) => {
    if (!acc[task.date]) {
      acc[task.date] = [];
    }
    acc[task.date].push(task);
    return acc;
  }, {});
}

function getTopTag(tasks, lang = state.language) {
  const counts = {};
  tasks.forEach((task) => {
    if (!task || !task.tag) {
      return;
    }
    counts[task.tag] = (counts[task.tag] || 0) + 1;
  });
  let top = "-";
  let max = 0;
  Object.entries(counts).forEach(([tag, count]) => {
    if (count > max) {
      top = tag;
      max = count;
    }
  });
  if (top === "-") {
    return "-";
  }
  const labels = TAG_LABELS[lang] || TAG_LABELS.en;
  return labels[top] || top;
}

function toHourValue(timeString) {
  const [hour, minute] = timeString.split(":").map(Number);
  return hour + minute / 60;
}

function formatDayCount(days, lang) {
  if (lang === "zh") {
    return `${days}${getText("labelDays", lang)}`;
  }
  const label = days === 1 ? getText("daySingular", lang) : getText("dayPlural", lang);
  return `${days} ${label}`;
}

function formatHolidayLabel(holiday, lang, name) {
  const dateValue = holiday.date || holiday.startDate;
  if (!dateValue) {
    return name;
  }
  const dateLabel = formatShortDate(parseDate(dateValue), lang);
  return `${dateLabel} ${name}`;
}

function formatWeekRangeLabel(date, lang) {
  return `${getText("weekOf", lang)} ${formatShortDate(date, lang)}`;
}

function formatRangeLabelForLang(date, view, lang) {
  if (view === "year") {
    return lang === "zh" ? `${date.getFullYear()}\u5e74` : String(date.getFullYear());
  }
  if (view === "month") {
    if (lang === "zh") {
      return `${date.getFullYear()}\u5e74${getMonthShort(date.getMonth(), lang)}`;
    }
    return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
  }
  if (view === "week") {
    const start = getWeekStart(date);
    const end = addDays(start, 6);
    return `${formatShortDate(start, lang)} - ${formatShortDate(end, lang)}`;
  }
  if (lang === "zh") {
    return `${getDayName(getDayIndex(date), lang)} ${formatShortDate(date, lang)}`;
  }
  return `${DAY_NAMES[getDayIndex(date)]}, ${formatShortDate(date, lang)}`;
}

function formatDayHeader(date, lang) {
  if (lang === "zh") {
    return `${getDayName(getDayIndex(date), lang)} ${formatShortDate(date, lang)}`;
  }
  return `${getDayName(getDayIndex(date), lang)} ${getMonthShort(date.getMonth(), lang)} ${date.getDate()}`;
}

function formatTaskCount(count, lang) {
  if (lang === "zh") {
    return `${count}${getText("taskPlural", lang)}`;
  }
  const label = count === 1 ? getText("taskSingular", lang) : getText("taskPlural", lang);
  return `${count} ${label}`;
}

function formatMoreLabel(count, lang) {
  if (lang === "zh") {
    return `+${count}${getText("more", lang)}`;
  }
  return `+${count} ${getText("more", lang)}`;
}

document.addEventListener("DOMContentLoaded", init);
