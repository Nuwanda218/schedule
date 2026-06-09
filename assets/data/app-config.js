export const APP_CONFIG = {
  brand: {
    mark: "Nuwanda",
    eyebrow: "Schedule Studio",
    taglineKey: "tagline"
  },
  defaults: {
    view: "year",
    yearView: "cards",
    season: "autumn",
    language: "en",
    newTask: {
      start: "09:00",
      end: "10:00",
      priority: "med",
      tag: "studio"
    }
  },
  modules: {
    settings: true,
    filters: false,
    today: true,
    quotes: true,
    yearOverview: true,
    yearCards: true,
    yearHeatmap: true,
    monthView: true,
    weekView: true,
    dayView: true
  },
  views: [
    { id: "year", labelKey: "viewYear", enabled: true },
    { id: "month", labelKey: "viewMonth", enabled: true },
    { id: "week", labelKey: "viewWeek", enabled: true },
    { id: "day", labelKey: "viewDay", enabled: true }
  ],
  tags: [
    { id: "studio", labelKey: "tagStudio", enabled: true },
    { id: "admin", labelKey: "tagAdmin", enabled: true },
    { id: "health", labelKey: "tagHealth", enabled: true },
    { id: "learning", labelKey: "tagLearning", enabled: true },
    { id: "travel", labelKey: "tagTravel", enabled: true }
  ],
  priorities: [
    { id: "high", labelKey: "priorityHigh", enabled: true },
    { id: "med", labelKey: "priorityMed", enabled: true },
    { id: "low", labelKey: "priorityLow", enabled: true }
  ],
  statusFilters: [
    { id: "all", labelKey: "all", enabled: true },
    { id: "open", labelKey: "statusOpen", enabled: true },
    { id: "done", labelKey: "statusDone", enabled: true }
  ],
  seasons: [
    { id: "spring", labelKey: "seasonSpring", enabled: true },
    { id: "summer", labelKey: "seasonSummer", enabled: true },
    { id: "autumn", labelKey: "seasonAutumn", enabled: true },
    { id: "winter", labelKey: "seasonWinter", enabled: true },
    { id: "joyful", labelKey: "seasonJoyful", enabled: true }
  ]
};
