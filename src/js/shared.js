/**
 * Shalimar Atelier — Shared Header/Footer HTML snippets
 * Injects the nav and footer via JS so markup stays DRY.
 */

export const NAV_LINKS = [
  { href: '/',             label: 'Home'     },
  { href: '/services.html',label: 'Services' },
  { href: '/gallery.html', label: 'Gallery'  },
];

/**
 * Build the shared header HTML string.
 * @param {string} currentPage - href that should be active, e.g. '/services.html'
 */
export function buildHeader(currentPage = '/') {
  const navItems = NAV_LINKS.map(link => {
    const active = link.href === currentPage;
    return `<a href="${link.href}" class="nav-link font-notoSerif uppercase tracking-[0.18em] text-sm transition-colors duration-300 ${active ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}">${link.label}</a>`;
  }).join('');

  return `
    <header id="site-header" class="fixed top-4 left-1/2 -translate-x-1/2 w-[92%] rounded-full z-50 bg-surface/80 dark:bg-[#131313]/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex justify-between items-center px-5 py-2.5 transition-all duration-300">
      <!-- Logo + Hamburger -->
      <div class="flex items-center gap-3">
        <button data-menu-btn class="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-drawer">
          <span class="material-symbols-outlined text-primary">menu</span>
        </button>
        <a href="/" class="font-notoSerif text-primary font-bold tracking-[0.3em] uppercase text-base">SHALIMAR</a>
      </div>

      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-8">
        ${navItems}
        <a href="/book-now.html" class="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-manrope font-bold text-[10px] tracking-widest uppercase hover:shadow-[0_0_20px_rgba(242,202,80,0.35)] active:scale-95 transition-all duration-200">Book Now</a>
      </nav>

      <!-- Right slot: theme toggle + auth -->
      <div class="flex items-center gap-2">
        <button data-theme-toggle class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-all" aria-label="Toggle theme">
          <span class="material-symbols-outlined" style="font-size:1.125rem;">light_mode</span>
        </button>
        <div data-auth-slot class="flex items-center"></div>
      </div>
    </header>
  `;
}

/**
 * Build the shared footer HTML string.
 */
export function buildFooter() {
  return `
    <footer class="w-full pt-20 pb-10 px-8 bg-[#0e0e0e] flex flex-col items-center gap-8 text-center border-t border-outline-variant/10">
      <a href="/" class="font-notoSerif text-primary text-2xl font-black tracking-[0.3em] uppercase hover:opacity-80 transition-opacity">SHALIMAR</a>
      <p class="font-manrope text-on-surface-variant text-sm max-w-xs leading-relaxed">
        Elevated grooming for the modern man. Where tradition meets contemporary craft.
      </p>
      <div class="flex gap-10 flex-wrap justify-center">
        ${[
          ['/', 'Home'],
          ['/services.html', 'Services'],
          ['/gallery.html', 'Gallery'],
          ['/book-now.html', 'Book Now'],
          ['/dashboard.html', 'My Account'],
        ].map(([href, label]) => `<a href="${href}" class="font-manrope text-[10px] tracking-[0.15em] uppercase text-on-surface-variant hover:text-primary transition-colors duration-300">${label}</a>`).join('')}
      </div>
      <div class="h-px w-full max-w-sm bg-outline-variant/20"></div>
      <p class="font-manrope text-[10px] tracking-[0.12em] uppercase text-on-surface-variant/40">
        © ${new Date().getFullYear()} Shalimar Atelier. All rights reserved.
      </p>
    </footer>
  `;
}

/**
 * Build the mobile bottom nav bar HTML.
 * @param {string} activePage
 */
export function buildBottomNav(activePage = '/') {
  const items = [
    { href: '/',             icon: 'home',          label: 'Home'     },
    { href: '/services.html',icon: 'content_cut',   label: 'Services' },
    { href: '/gallery.html', icon: 'photo_library', label: 'Gallery'  },
    { href: '/book-now.html',icon: 'calendar_today',label: 'Book'     },
    { href: '/dashboard.html',icon: 'person',       label: 'Account'  },
  ];

  return `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/15 flex justify-around items-center py-2 px-2 safe-area-pb">
      ${items.map(item => {
        const active = activePage === item.href || (item.href !== '/' && activePage.includes(item.href.replace('.html', '')));
        return `
          <a href="${item.href}" data-bottom-nav-link="${item.href}" style="display:flex;flex-direction:column;align-items:center;gap:0.2rem;padding:0.375rem 0.75rem;border-radius:0.5rem;text-decoration:none;transition:all 0.2s;">
            <span class="material-symbols-outlined" style="font-size:1.375rem;color:${active ? '#f2ca50' : '#99907c'};${active ? "font-variation-settings:'FILL' 1;" : ''}">${item.icon}</span>
            <span style="font-family:Manrope,sans-serif;font-size:0.5625rem;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;color:${active ? '#f2ca50' : '#99907c'};">${item.label}</span>
          </a>
        `;
      }).join('')}
    </nav>
  `;
}
