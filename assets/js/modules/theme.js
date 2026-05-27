import { DEFAULT_SEASON, SEASON_STORAGE_KEY, SEASONS, THEME_ROOT } from "../core/constants.js";

export function normalizeSeason(season) {
  return SEASONS.includes(season) ? season : DEFAULT_SEASON;
}

export function getSeasonThemePath(season, theme) {
  const safeSeason = normalizeSeason(season);
  const safeTheme = theme === "dark" ? "dark" : "light";
  const suffix = safeTheme === "dark" ? "-dark" : "";

  return `${THEME_ROOT}/${safeSeason}${suffix}.css`;
}

export function loadSeason() {
  try {
    return normalizeSeason(localStorage.getItem(SEASON_STORAGE_KEY));
  } catch (error) {
    return DEFAULT_SEASON;
  }
}

export function saveSeason(season) {
  try {
    localStorage.setItem(SEASON_STORAGE_KEY, season);
  } catch (error) {
    // Ignore storage errors for season preference.
  }
}
