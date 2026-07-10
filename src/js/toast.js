/**
 * Shalimar Atelier — Toast Notification System
 * Supports: success, error, info, warning
 * Features: auto-dismiss, progress bar, stackable, accessible
 */

let toastContainer = null;
let toastIdCounter = 0;

const ICONS = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const COLORS = {
  success: { bar: '#4caf7d', icon: '#4caf7d', bg: 'rgba(76,175,125,0.08)', border: 'rgba(76,175,125,0.25)' },
  error:   { bar: '#ef5350', icon: '#ef5350', bg: 'rgba(239,83,80,0.08)',  border: 'rgba(239,83,80,0.25)' },
  warning: { bar: '#f2ca50', icon: '#f2ca50', bg: 'rgba(242,202,80,0.08)', border: 'rgba(242,202,80,0.25)' },
  info:    { bar: '#64b5f6', icon: '#64b5f6', bg: 'rgba(100,181,246,0.08)', border: 'rgba(100,181,246,0.25)' },
};

/**
 * Ensure the toast container exists in the DOM.
 */
function ensureContainer() {
  if (toastContainer) return toastContainer;
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  toastContainer.setAttribute('aria-atomic', 'false');
  toastContainer.style.cssText = `
    position: fixed;
    top: 5.5rem;
    right: 1.25rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 22rem;
    width: calc(100vw - 2.5rem);
    pointer-events: none;
  `;
  document.body.appendChild(toastContainer);
  return toastContainer;
}

/**
 * Show a toast notification.
 * @param {string} message - Main message text
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {object} [options]
 * @param {string} [options.title] - Optional bold title
 * @param {number} [options.duration=4000] - Auto-dismiss delay in ms (0 = no auto-dismiss)
 */
export function showToast(message, type = 'info', options = {}) {
  const { title = '', duration = 4000 } = options;
  const container = ensureContainer();
  const id = ++toastIdCounter;
  const color = COLORS[type] || COLORS.info;
  const icon = ICONS[type] || ICONS.info;

  const toast = document.createElement('div');
  toast.id = `toast-${id}`;
  toast.setAttribute('role', 'alert');
  toast.style.cssText = `
    pointer-events: all;
    background: var(--toast-bg, #201f1f);
    background-color: #201f1f;
    border: 1px solid ${color.border};
    border-radius: 0.75rem;
    padding: 0.875rem 1rem;
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transform: translateX(120%);
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
    opacity: 0;
    overflow: hidden;
    position: relative;
    backdrop-filter: blur(12px);
  `;

  toast.innerHTML = `
    <span class="material-symbols-outlined" style="color:${color.icon};font-size:1.25rem;flex-shrink:0;margin-top:0.1rem;font-variation-settings:'FILL' 1;">${icon}</span>
    <div style="flex:1;min-width:0;">
      ${title ? `<p style="font-family:Manrope,sans-serif;font-weight:700;font-size:0.8125rem;color:#e5e2e1;margin:0 0 0.15rem;">${title}</p>` : ''}
      <p style="font-family:Manrope,sans-serif;font-size:0.8125rem;color:#d0c5af;margin:0;line-height:1.5;">${message}</p>
    </div>
    <button onclick="this.closest('[id^=toast-]').remove()" style="background:none;border:none;padding:0;cursor:pointer;color:#99907c;flex-shrink:0;line-height:1;font-size:1rem;" aria-label="Dismiss">
      <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
    </button>
    <div class="toast-progress" style="
      position:absolute;bottom:0;left:0;height:2px;
      background:${color.bar};width:100%;
      transform-origin:left;
      transition: transform linear ${duration}ms;
      transform: scaleX(1);
    "></div>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });
  });

  // Start progress bar shrink
  if (duration > 0) {
    setTimeout(() => {
      const bar = toast.querySelector('.toast-progress');
      if (bar) bar.style.transform = 'scaleX(0)';
    }, 50);

    // Auto-dismiss
    setTimeout(() => dismissToast(toast), duration);
  }

  return id;
}

function dismissToast(toast) {
  if (!toast || !toast.parentNode) return;
  toast.style.transform = 'translateX(120%)';
  toast.style.opacity = '0';
  setTimeout(() => toast.remove(), 350);
}

// Convenience helpers
export const toast = {
  success: (msg, opts) => showToast(msg, 'success', opts),
  error:   (msg, opts) => showToast(msg, 'error',   opts),
  warning: (msg, opts) => showToast(msg, 'warning', opts),
  info:    (msg, opts) => showToast(msg, 'info',    opts),
};
