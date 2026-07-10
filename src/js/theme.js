/**
 * Shalimar Atelier — Theme Module
 * Manages dark/light mode toggle with localStorage persistence.
 */

const THEME_KEY = 'shalimar-theme';
const DARK = 'dark';
const LIGHT = 'light';

/**
 * Get the stored theme, defaulting to dark.
 */
function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || DARK;
}

/**
 * Apply a theme to the <html> element.
 * @param {'dark'|'light'} theme
 */
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === LIGHT) {
    html.classList.remove(DARK);
    html.classList.add(LIGHT);
  } else {
    html.classList.remove(LIGHT);
    html.classList.add(DARK);
  }
  localStorage.setItem(THEME_KEY, theme);
  updateToggleIcons(theme);
}

/**
 * Toggle between dark and light.
 */
export function toggleTheme() {
  const current = getStoredTheme();
  applyTheme(current === DARK ? LIGHT : DARK);
}

/**
 * Update all theme toggle button icons on the page.
 * @param {'dark'|'light'} theme
 */
function updateToggleIcons(theme) {
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = theme === DARK ? 'light_mode' : 'dark_mode';
    }
    btn.setAttribute('aria-label', theme === DARK ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = theme === DARK ? 'Light mode' : 'Dark mode';
  });
}

/**
 * Initialize theme: apply stored preference and wire up toggle buttons.
 */
export function initTheme() {
  // Apply immediately (before paint) to prevent flash
  const theme = getStoredTheme();
  applyTheme(theme);

  // Wire up any toggle buttons found in the DOM
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
}

// Apply theme immediately on script load (prevents FOUC)
applyTheme(getStoredTheme());

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTheme);
} else {
  initTheme();
}
