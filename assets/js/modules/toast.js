/**
 * Toast notification system.
 * Displays brief, auto-dismissing messages at the bottom of the viewport.
 */

let container = null;

function ensureContainer() {
  if (container && document.body.contains(container)) {
    return container;
  }
  container = document.createElement("div");
  container.className = "toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "true");
  document.body.appendChild(container);
  return container;
}

/**
 * Show a toast message.
 * @param {string} message - Text or HTML to display
 * @param {object} [options]
 * @param {"info"|"success"|"error"} [options.type="info"]
 * @param {number} [options.duration=2500] - ms before auto-dismiss
 */
export function showToast(message, options = {}) {
  const { type = "info", duration = 2500 } = options;
  const parent = ensureContainer();

  const toast = document.createElement("div");
  toast.className = `toast${type !== "info" ? ` is-${type}` : ""}`;
  toast.innerHTML = message;
  parent.appendChild(toast);

  const timer = setTimeout(() => dismiss(toast), duration);

  toast.addEventListener("click", () => {
    clearTimeout(timer);
    dismiss(toast);
  });
}

function dismiss(toast) {
  if (!toast || !toast.parentNode) {
    return;
  }
  toast.classList.add("is-leaving");
  toast.addEventListener("animationend", () => {
    toast.remove();
  });
}
