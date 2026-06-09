import { APP_CONFIG } from "../../data/app-config.js";

export function getEnabledItems(items = []) {
  return items.filter((item) => item.enabled !== false);
}

export function getConfig() {
  return APP_CONFIG;
}

export function getDefaultTaskConfig() {
  return APP_CONFIG.defaults.newTask;
}

export function getEnabledViews() {
  return getEnabledItems(APP_CONFIG.views);
}

export function getEnabledTags() {
  return getEnabledItems(APP_CONFIG.tags);
}

export function getEnabledPriorities() {
  return getEnabledItems(APP_CONFIG.priorities);
}

export function getEnabledStatusFilters() {
  return getEnabledItems(APP_CONFIG.statusFilters);
}

export function getEnabledSeasons() {
  return getEnabledItems(APP_CONFIG.seasons);
}
