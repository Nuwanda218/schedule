import { STORAGE_KEY } from "./constants.js";
import { addDays, formatDate } from "../modules/dates.js";

export function readStoredTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    throw new Error("No data");
  }

  const data = JSON.parse(raw);

  if (!data || !Array.isArray(data.tasks)) {
    throw new Error("Invalid data");
  }

  return data.tasks;
}

export function writeStoredTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks }));
}

export function seedTasks(baseDate) {
  const base = new Date(baseDate);
  const year = base.getFullYear();
  const month = base.getMonth();
  const day = base.getDate();

  return [
    createTask("Design Sprint", new Date(year, month, day), "09:30", "11:30", "high", "studio", false, "Draft three directions."),
    createTask("Client Review", new Date(year, month, day), "14:00", "15:30", "med", "admin", false, "Align on scope."),
    createTask("Long Run", addDays(base, 1), "07:00", "08:15", "low", "health", true, ""),
    createTask("Deep Work", addDays(base, 2), "10:00", "12:00", "high", "learning", false, "Module 4."),
    createTask("Weekly Retro", addDays(base, 4), "16:00", "17:00", "med", "admin", false, ""),
    createTask("Prototype Build", addDays(base, 7), "09:00", "12:00", "high", "studio", false, ""),
    createTask("Strategy Day", new Date(year, month, 1), "13:00", "17:00", "med", "studio", true, ""),
    createTask("Quarter Review", new Date(year, 2, 18), "11:00", "12:30", "high", "admin", false, ""),
    createTask("Summit", new Date(year, 5, 6), "09:00", "18:00", "high", "travel", false, ""),
    createTask("Focus Retreat", new Date(year, 8, 22), "10:00", "16:00", "med", "learning", false, ""),
    createTask("Year Wrap", new Date(year, 11, 12), "15:00", "17:30", "med", "admin", false, "")
  ];
}

export function createTask(title, date, start, end, priority, tag, completed, notes) {
  return {
    id: randomId(),
    title,
    date: formatDate(date),
    start,
    end,
    priority,
    tag,
    completed,
    notes
  };
}

function randomId() {
  if (window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `task-${Math.random().toString(36).slice(2, 10)}`;
}
