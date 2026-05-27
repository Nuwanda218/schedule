export function toggleSettingsPanel(ui, forceOpen) {
  if (!ui.cornerControls || !ui.settingsToggle || !ui.settingsPanel) {
    return;
  }

  const isOpen = ui.cornerControls.classList.contains("is-open");
  const nextOpen = typeof forceOpen === "boolean" ? forceOpen : !isOpen;

  ui.cornerControls.classList.toggle("is-open", nextOpen);
  ui.settingsToggle.setAttribute("aria-expanded", String(nextOpen));
  ui.settingsPanel.setAttribute("aria-hidden", String(!nextOpen));
}
