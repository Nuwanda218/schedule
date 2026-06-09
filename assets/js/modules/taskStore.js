import { addDays, formatDate, getWeekStart, parseDate } from "./dates.js";

export function normalizeTask(task, fallback = {}) {
  const safe = task && typeof task === "object" ? task : {};
  const fallbackDate = fallback.date || formatDate(new Date());
  return {
    id: safe.id || fallback.id || `task-${Date.now()}`,
    title: String(safe.title || fallback.title || "").trim(),
    titleAlt: safe.titleAlt ? String(safe.titleAlt) : "",
    date: safe.date || fallbackDate,
    start: safe.start || fallback.start || "09:00",
    end: safe.end || fallback.end || "10:00",
    priority: safe.priority || fallback.priority || "med",
    tag: safe.tag || fallback.tag || "studio",
    notes: safe.notes ? String(safe.notes) : "",
    completed: Boolean(safe.completed),
    source: safe.source || fallback.source || "user"
  };
}

export function sortTasksByDateTime(tasks) {
  return [...tasks].sort((a, b) => {
    const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return String(a.start || "").localeCompare(String(b.start || ""));
  });
}

export function mergeTasks(baseItems = [], userTasks = []) {
  const merged = new Map();

  baseItems.forEach((task) => {
    if (!task || !task.id) {
      return;
    }
    merged.set(task.id, normalizeTask(task, { source: "schedule" }));
  });

  userTasks.forEach((task) => {
    if (!task || !task.id) {
      return;
    }
    merged.set(task.id, normalizeTask(task, { source: "user" }));
  });

  return sortTasksByDateTime([...merged.values()]);
}

export function getTasksForDate(tasks, date) {
  const dateKey = typeof date === "string" ? date : formatDate(date);
  return sortTasksByDateTime(tasks.filter((task) => task.date === dateKey));
}

export function getTasksForMonth(tasks, date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return sortTasksByDateTime(
    tasks.filter((task) => {
      const taskDate = parseDate(task.date);
      return taskDate.getFullYear() === year && taskDate.getMonth() === month;
    })
  );
}

export function getTasksForWeek(tasks, date) {
  const start = getWeekStart(date);
  const dates = new Set(Array.from({ length: 7 }, (_, index) => formatDate(addDays(start, index))));
  return sortTasksByDateTime(tasks.filter((task) => dates.has(task.date)));
}
