import { DAY_NAMES, MONTH_NAMES } from "../core/constants.js";
import {
  addDays,
  formatShortDate,
  getDayIndex,
  getDayName,
  getMonthShort,
  getWeekStart,
  parseDate
} from "./dates.js";
import { getText } from "./i18n.js";

export function groupByDate(tasks) {
  return tasks.reduce((acc, task) => {
    if (!acc[task.date]) {
      acc[task.date] = [];
    }

    acc[task.date].push(task);
    return acc;
  }, {});
}

export function getTopTag(tasks, tagLabels, lang) {
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

  const labels = tagLabels[lang] || tagLabels.en;
  return labels[top] || top;
}

export function toHourValue(timeString) {
  const [hour, minute] = timeString.split(":").map(Number);
  return hour + minute / 60;
}

export function formatDayCount(days, lang) {
  if (lang === "zh") {
    return `${days}${getText("labelDays", lang)}`;
  }

  const label = days === 1 ? getText("daySingular", lang) : getText("dayPlural", lang);
  return `${days} ${label}`;
}

export function formatHolidayLabel(holiday, lang, name) {
  const dateValue = holiday.date || holiday.startDate;

  if (!dateValue) {
    return name;
  }

  const dateLabel = formatShortDate(parseDate(dateValue), lang);
  return `${dateLabel} ${name}`;
}

export function formatWeekRangeLabel(date, lang) {
  return `${getText("weekOf", lang)} ${formatShortDate(date, lang)}`;
}

export function formatRangeLabelForLang(date, view, lang) {
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

export function formatDayHeader(date, lang) {
  if (lang === "zh") {
    return `${getDayName(getDayIndex(date), lang)} ${formatShortDate(date, lang)}`;
  }

  return `${getDayName(getDayIndex(date), lang)} ${getMonthShort(date.getMonth(), lang)} ${date.getDate()}`;
}

export function formatTaskCount(count, lang) {
  if (lang === "zh") {
    return `${count}${getText("taskPlural", lang)}`;
  }

  const label = count === 1 ? getText("taskSingular", lang) : getText("taskPlural", lang);
  return `${count} ${label}`;
}

export function formatMoreLabel(count, lang) {
  if (lang === "zh") {
    return `+${count}${getText("more", lang)}`;
  }

  return `+${count} ${getText("more", lang)}`;
}
