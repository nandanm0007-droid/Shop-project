/**
 * Shalimar Atelier - Scroll Animations Module
 * Handles scroll-triggered animations, parallax, and smooth scroll
 */

// Intersection Observer for scroll animations
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('[data-animate]');

  if (!animatedElements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const animation = el.dataset.animate;
        const delay = el.dataset.delay || 0;

        setTimeout(() => {
          el.classList.add('animate-in', `animate-${animation}`);
          el.style.opacity = '1';
          el.style.transform = 'none';
        }, delay);

        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  animatedElements.forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

// Smooth scroll for anchor links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Update URL without scrolling
        history.pushState(null, null, targetId);
      }
    });
  });
}

// Parallax effect for hero images
function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');

  if (!parallaxElements.length) return;

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;

    parallaxElements.forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.5;
      const offset = scrollY * speed;
      el.style.transform = `translateY(${offset}px)`;
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

// Header scroll effect (glassmorphism)
function initHeaderScrollEffect() {
  const header = document.querySelector('header.fixed');

  if (!header) return;

  let ticking = false;
  let lastScrollY = window.scrollY;

  function updateHeader() {
    const scrollY = window.scrollY;

    if (scrollY > 100) {
      header.classList.add('bg-surface/95', 'shadow-[0_20px_40px_rgba(0,0,0,0.4)]');
      header.classList.remove('bg-surface/80');
    } else {
      header.classList.remove('bg-surface/95', 'shadow-[0_20px_40px_rgba(0,0,0,0.4)]');
      header.classList.add('bg-surface/80');
    }

    // Hide on scroll down, show on scroll up
    if (scrollY > lastScrollY && scrollY > 200) {
      header.style.transform = 'translateX(-50%) translateY(-100%)';
    } else {
      header.style.transform = 'translateX(-50%) translateY(0)';
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}

// Scroll spy for active nav link
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('header nav a[href^="/"], header nav a[href^="#"]');

  if (!sections.length || !navLinks.length) return;

  let ticking = false;

  function updateActiveLink() {
    const scrollY = window.scrollY + 150;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          const linkPath = href.startsWith('/') ? href.slice(1) : href;
          const linkHash = href.startsWith('#') ? href.slice(1) : null;

          if (linkPath === sectionId || linkHash === sectionId) {
            link.classList.add('text-primary');
            link.classList.remove('text-on-surface-variant');
          } else {
            link.classList.remove('text-primary');
            link.classList.add('text-on-surface-variant');
          }
        });
      }
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateActiveLink);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateActiveLink(); // Initial check
}

// Reveal on scroll with stagger
function initStaggerReveal() {
  const staggerContainers = document.querySelectorAll('[data-stagger]');

  staggerContainers.forEach(container => {
    const items = container.querySelectorAll('[data-stagger-item]');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          items.forEach((item, index) => {
            const delay = parseInt(item.dataset.staggerDelay) || index * 100;
            setTimeout(() => {
              item.classList.add('opacity-100', 'translate-y-0');
              item.classList.remove('opacity-0', 'translate-y-8');
            }, delay);
          });
          observer.unobserve(container);
        }
      });
    }, { threshold: 0.1 });

    items.forEach(item => {
      item.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-700', 'ease-out');
    });

    observer.observe(container);
  });
}

// Initialize all scroll features
export function initAllScrollFeatures() {
  initScrollAnimations();
  initSmoothScroll();
  initParallax();
  initHeaderScrollEffect();
  initScrollSpy();
  initStaggerReveal();
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllScrollFeatures);
} else {
  initAllScrollFeatures();
}