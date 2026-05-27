import { MONTH_NAMES, MONTH_SHORT, DAY_NAMES, MONTH_NAMES_ZH, MONTH_SHORT_ZH, DAY_NAMES_ZH } from "../core/constants.js";

export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthName(monthIndex, lang) {
  return lang === "zh" ? MONTH_NAMES_ZH[monthIndex] : MONTH_NAMES[monthIndex];
}

export function getMonthShort(monthIndex, lang) {
  return lang === "zh" ? MONTH_SHORT_ZH[monthIndex] : MONTH_SHORT[monthIndex];
}

export function getDayName(dayIndex, lang) {
  return lang === "zh" ? DAY_NAMES_ZH[dayIndex] : DAY_NAMES[dayIndex];
}

export function formatShortDate(date, lang = "en") {
  if (lang === "zh") {
    return `${MONTH_SHORT_ZH[date.getMonth()]}${date.getDate()}\u65e5`;
  }
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

export function diffInDays(start, end) {
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / 86400000);
}

export function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function getWeekIndex(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstIndex = (first.getDay() + 6) % 7;
  return Math.floor((date.getDate() + firstIndex - 1) / 7) + 1;
}

export function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

export function getDayIndex(date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}
