/**
 * Shalimar Atelier - Mobile Navigation Module
 * Handles hamburger menu toggle and mobile navigation drawer
 */

export function initMobileNav() {
  const menuBtn = document.querySelector('[data-icon="menu"]');
  const mobileNav = document.querySelector('.md\\:hidden.fixed.bottom-0');
  const navLinks = document.querySelector('.hidden.md\\:flex');

  if (!menuBtn) return;

  // Create mobile drawer if it doesn't exist
  let drawer = document.getElementById('mobile-drawer');
  if (!drawer) {
    drawer = createMobileDrawer();
    document.body.appendChild(drawer);
  }

  const drawerOverlay = drawer.querySelector('.drawer-overlay');
  const drawerPanel = drawer.querySelector('.drawer-panel');
  const drawerClose = drawer.querySelector('.drawer-close');
  const drawerLinks = drawer.querySelectorAll('.drawer-link');

  let isOpen = false;

  function createMobileDrawer() {
    const navHtml = navLinks ? navLinks.innerHTML : '';
    const logoHtml = document.querySelector('.font-notoSerif.text-\\[\\#f2ca50\\]')?.outerHTML || '';

    const div = document.createElement('div');
    div.id = 'mobile-drawer';
    div.className = 'fixed inset-0 z-50 opacity-0 pointer-events-none transition-opacity duration-300';
    div.innerHTML = `
      <div class="drawer-overlay absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div class="drawer-panel absolute top-0 right-0 h-full w-[85%] max-w-sm bg-surface border-l border-outline-variant/20 transform translate-x-full transition-transform duration-300 ease-out flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-outline-variant/20">
          ${logoHtml}
          <button class="drawer-close p-2 rounded-lg hover:bg-surface-container-high transition-colors" aria-label="Close menu">
            <span class="material-symbols-outlined text-on-surface text-xl">close</span>
          </button>
        </div>
        <nav class="flex-1 p-6 space-y-4 overflow-y-auto">
          ${navHtml.replace(/href="([^"]+)"/g, 'href="$1" class="drawer-link block py-3 px-4 rounded-lg text-on-surface font-notoSerif uppercase tracking-[0.2em] text-sm hover:bg-surface-container-high transition-colors"')}
        </nav>
        <div class="p-6 border-t border-outline-variant/20">
          <a href="/book-now.html" class="drawer-link w-full text-center bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-md font-manrope font-bold uppercase tracking-widest text-sm block hover:shadow-[0_0_20px_rgba(242,202,80,0.3)] transition-all">
            Book Now
          </a>
        </div>
      </div>
    `;
    return div;
  }

  function openDrawer() {
    isOpen = true;
    drawer.classList.remove('pointer-events-none');
    drawer.classList.add('opacity-100');
    drawerOverlay.classList.remove('pointer-events-none');
    drawerPanel.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
    menuBtn.setAttribute('aria-expanded', 'true');
    drawerClose.focus();
  }

  function closeDrawer() {
    isOpen = false;
    drawer.classList.add('pointer-events-none');
    drawer.classList.remove('opacity-100');
    drawerPanel.classList.add('translate-x-full');
    document.body.style.overflow = '';
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.focus();
  }

  function toggleDrawer() {
    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  // Event listeners
  menuBtn.addEventListener('click', toggleDrawer);
  drawerClose.addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeDrawer();
    }
  });

  // Handle resize - close drawer if screen becomes desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && isOpen) {
      closeDrawer();
    }
  });

  // Add ARIA attributes
  menuBtn.setAttribute('aria-label', 'Open menu');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-controls', 'mobile-drawer');
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
  initMobileNav();
}