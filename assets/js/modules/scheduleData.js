import { DATA_ROOT, MONTH_SLUGS } from "../core/constants.js";
import { getWeekIndex } from "./dates.js";

const dataCache = new Map();

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

export function normalizeYearData(data, year) {
  const safe = data && typeof data === "object" ? data : {};
  return {
    year: safe.year || year,
    title: safe.title || "",
    holidays: Array.isArray(safe.holidays) ? safe.holidays.map(normalizeHoliday) : [],
    plans: Array.isArray(safe.plans) ? safe.plans.map(normalizePlan) : []
  };
}

export function normalizeMonthData(data, year, monthIndex) {
  const safe = data && typeof data === "object" ? data : {};
  return {
    year: safe.year || year,
    month: typeof safe.month === "number" ? safe.month : monthIndex + 1,
    title: safe.title || "",
    items: normalizeItems(safe.items, "month")
  };
}

export function normalizeWeekData(data, year, monthIndex, weekIndex) {
  const safe = data && typeof data === "object" ? data : {};
  return {
    year: safe.year || year,
    month: typeof safe.month === "number" ? safe.month : monthIndex + 1,
    week: typeof safe.week === "number" ? safe.week : weekIndex,
    items: normalizeItems(safe.items, "week")
  };
}

export function normalizeDayData(data, year, monthIndex, weekIndex) {
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

export async function loadScheduleData(currentDate) {
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const weekIndex = getWeekIndex(currentDate);
  const [yearData, monthData, weekData, dayData] = await Promise.all([
    fetchJson(getYearPath(year)),
    fetchJson(getMonthPath(year, monthIndex)),
    fetchJson(getWeekPath(year, monthIndex, weekIndex)),
    fetchJson(getDayPath(year, monthIndex, weekIndex))
  ]);

  return {
    year: normalizeYearData(yearData, year),
    month: normalizeMonthData(monthData, year, monthIndex),
    week: normalizeWeekData(weekData, year, monthIndex, weekIndex),
    day: normalizeDayData(dayData, year, monthIndex, weekIndex)
  };
}

export async function loadDayData(date) {
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const weekIndex = getWeekIndex(date);
  const dayData = await fetchJson(getDayPath(year, monthIndex, weekIndex));

  return normalizeDayData(dayData, year, monthIndex, weekIndex);
}
