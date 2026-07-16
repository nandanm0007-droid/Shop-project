/**
 * Shalimar Atelier — Gallery Filter Module
 * Filters gallery items by category with smooth CSS transitions.
 */

/**
 * Initialize gallery filtering.
 * Looks for [data-filter-bar] with [data-filter] buttons,
 * and [data-gallery-item] elements with [data-category] attributes.
 */
export function initGalleryFilter() {
  const filterBar = document.querySelector('[data-filter-bar]');
  if (!filterBar) return;

  const filterBtns = filterBar.querySelectorAll('[data-filter]');
  const galleryItems = document.querySelectorAll('[data-gallery-item]');

  if (!filterBtns.length || !galleryItems.length) return;

  // Set initial item styles for transition
  galleryItems.forEach(item => {
    item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach(b => {
        b.classList.remove('active-filter');
        b.style.background = 'transparent';
        b.style.color = '#d0c5af';
        b.style.borderColor = 'rgba(77,70,53,0.3)';
      });
      btn.classList.add('active-filter');
      btn.style.background = '#f2ca50';
      btn.style.color = '#3c2f00';
      btn.style.borderColor = '#f2ca50';

      // Filter items
      galleryItems.forEach(item => {
        const category = item.dataset.category || 'all';
        const matches = filter === 'all' || category === filter || category.split(',').includes(filter);

        if (matches) {
          item.style.opacity = '1';
          item.style.transform = 'scale(1)';
          item.style.pointerEvents = 'all';
          item.style.display = '';
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          item.style.pointerEvents = 'none';
          setTimeout(() => {
            if (item.style.opacity === '0') item.style.display = 'none';
          }, 400);
        }
      });
    });
  });

  // Activate first filter button by default
  if (filterBtns[0]) filterBtns[0].click();
}
