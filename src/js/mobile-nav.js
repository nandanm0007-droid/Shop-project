/**
 * Shalimar Atelier — Mobile Navigation Module (v2)
 * Auth-aware drawer, improved animations, bottom nav sync.
 */

import { initTheme } from './theme.js';
import { updateAuthHeader } from './auth.js';

export function initMobileNav() {
  // ── Theme init
  initTheme();

  // ── Auth header
  updateAuthHeader();

  // ── Drawer
  const menuBtn = document.querySelector('[data-menu-btn]');
  if (!menuBtn) return;

  let drawer = document.getElementById('mobile-drawer');
  if (!drawer) {
    drawer = createDrawer();
    document.body.appendChild(drawer);
  }

  const overlay   = drawer.querySelector('.drawer-overlay');
  const panel     = drawer.querySelector('.drawer-panel');
  const closeBtn  = drawer.querySelector('.drawer-close-btn');
  let isOpen = false;

  function open() {
    isOpen = true;
    drawer.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    panel.style.transform = 'translateX(0)';
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
    setTimeout(() => closeBtn?.focus(), 200);
  }

  function close() {
    isOpen = false;
    overlay.style.opacity = '0';
    panel.style.transform = 'translateX(100%)';
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
    setTimeout(() => {
      drawer.style.pointerEvents = 'none';
    }, 300);
  }

  menuBtn.addEventListener('click', () => isOpen ? close() : open());
  overlay.addEventListener('click', close);
  closeBtn?.addEventListener('click', close);

  drawer.querySelectorAll('.drawer-link').forEach(link => link.addEventListener('click', close));

  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) close(); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 768 && isOpen) close(); });

  menuBtn.setAttribute('aria-label', 'Open navigation menu');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-controls', 'mobile-drawer');

  // ── Bottom nav active state
  const currentPath = window.location.pathname;
  document.querySelectorAll('[data-bottom-nav-link]').forEach(link => {
    const href = link.dataset.bottomNavLink;
    const isActive = currentPath === href || (href !== '/' && currentPath.includes(href.replace('.html', '')));
    const icon = link.querySelector('.material-symbols-outlined');
    const label = link.querySelector('span:last-child');
    if (isActive) {
      if (icon) { icon.style.color = '#f2ca50'; icon.setAttribute('style', "font-variation-settings:'FILL' 1;color:#f2ca50;"); }
      if (label) label.style.color = '#f2ca50';
    }
  });
}

function createDrawer() {
  const currentPath = window.location.pathname;
  const links = [
    { href: '/', label: 'Home',     icon: 'home' },
    { href: '/services.html', label: 'Services', icon: 'content_cut' },
    { href: '/gallery.html',  label: 'Gallery',  icon: 'photo_library' },
    { href: '/book-now.html', label: 'Book Now', icon: 'calendar_today' },
    { href: '/dashboard.html',label: 'My Account',icon: 'person' },
  ];

  const div = document.createElement('div');
  div.id = 'mobile-drawer';
  div.setAttribute('role', 'dialog');
  div.setAttribute('aria-modal', 'true');
  div.setAttribute('aria-label', 'Navigation menu');
  div.style.cssText = 'position:fixed;inset:0;z-index:200;pointer-events:none;';

  div.innerHTML = `
    <div class="drawer-overlay" style="
      position:absolute;inset:0;background:rgba(0,0,0,0.6);
      backdrop-filter:blur(4px);opacity:0;transition:opacity 0.3s ease;
    "></div>
    <nav class="drawer-panel" style="
      position:absolute;top:0;right:0;height:100%;width:min(80vw,22rem);
      background:#131313;border-left:1px solid rgba(77,70,53,0.25);
      transform:translateX(100%);transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
      display:flex;flex-direction:column;overflow-y:auto;
    ">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1.5rem;border-bottom:1px solid rgba(77,70,53,0.2);">
        <span style="font-family:'Noto Serif',serif;color:#f2ca50;font-weight:700;letter-spacing:0.3em;font-size:1rem;text-transform:uppercase;">SHALIMAR</span>
        <button class="drawer-close-btn" aria-label="Close menu" style="
          background:rgba(255,255,255,0.05);border:1px solid rgba(77,70,53,0.3);
          border-radius:50%;width:2.25rem;height:2.25rem;cursor:pointer;
          display:flex;align-items:center;justify-content:center;color:#d0c5af;
          transition:all 0.2s;
        ">
          <span class="material-symbols-outlined" style="font-size:1.125rem;">close</span>
        </button>
      </div>
      <div style="flex:1;padding:1.5rem;">
        ${links.map(l => {
          const active = currentPath === l.href || (l.href !== '/' && currentPath.includes(l.href.replace('.html', '')));
          return `
          <a href="${l.href}" class="drawer-link" style="
            display:flex;align-items:center;gap:0.875rem;padding:0.875rem;
            border-radius:0.75rem;margin-bottom:0.25rem;text-decoration:none;
            color:${active ? '#f2ca50' : '#d0c5af'};
            background:${active ? 'rgba(242,202,80,0.06)' : 'transparent'};
            font-family:Manrope,sans-serif;font-size:0.875rem;
            font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
            transition:all 0.2s;
          ">
            <span class="material-symbols-outlined" style="font-size:1.25rem;${active ? "font-variation-settings:'FILL' 1;" : ''}">${l.icon}</span>
            ${l.label}
          </a>`;
        }).join('')}
      </div>
      <div style="padding:1.5rem;border-top:1px solid rgba(77,70,53,0.2);">
        <a href="/book-now.html" class="drawer-link" style="
          display:block;text-align:center;
          background:linear-gradient(135deg,#f2ca50,#d4af37);
          color:#3c2f00;font-family:Manrope,sans-serif;font-weight:800;
          font-size:0.6875rem;letter-spacing:0.15em;text-transform:uppercase;
          padding:0.875rem;border-radius:9999px;text-decoration:none;
          transition:box-shadow 0.3s;
        ">Book Your Session</a>
      </div>
    </nav>
  `;
  return div;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}