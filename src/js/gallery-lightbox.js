/**
 * Shalimar Atelier - Gallery Lightbox Module
 * Handles image lightbox for gallery page
 */

export function initGalleryLightbox() {
  const galleryImages = document.querySelectorAll('.editorial-grid img[data-alt]');

  if (!galleryImages.length) return;

  // Create lightbox elements
  const lightbox = document.createElement('div');
  lightbox.id = 'gallery-lightbox';
  lightbox.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm opacity-0 invisible pointer-events-none transition-all duration-300';
  lightbox.innerHTML = `
    <button class="lightbox-close absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-2xl" aria-label="Close lightbox">
      <span class="material-symbols-outlined">close</span>
    </button>
    <button class="lightbox-prev absolute left-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-2xl hidden md:block" aria-label="Previous image">
      <span class="material-symbols-outlined">chevron_left</span>
    </button>
    <button class="lightbox-next absolute right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-2xl hidden md:block" aria-label="Next image">
      <span class="material-symbols-outlined">chevron_right</span>
    </button>
    <div class="lightbox-content relative max-w-[90vw] max-h-[85vh]">
      <img class="max-w-full max-h-[85vh] object-contain" alt="" />
      <div class="lightbox-caption text-center mt-4 text-white/70 text-sm"></div>
    </div>
    <div class="lightbox-counter absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm"></div>
  `;

  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const lightboxCounter = lightbox.querySelector('.lightbox-counter');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  const overlay = lightbox;

  let currentIndex = 0;
  const images = Array.from(galleryImages);

  function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    lightbox.classList.remove('opacity-0', 'invisible', 'pointer-events-none');
    lightbox.classList.add('opacity-100', 'visible', 'pointer-events-auto');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();

    // Trap focus
    lightbox.addEventListener('keydown', handleKeydown);
  }

  function closeLightbox() {
    lightbox.classList.add('opacity-0', 'invisible', 'pointer-events-none');
    lightbox.classList.remove('opacity-100', 'visible', 'pointer-events-auto');
    document.body.style.overflow = '';
    lightbox.removeEventListener('keydown', handleKeydown);
  }

  function updateLightbox() {
    const img = images[currentIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || '';
    lightboxCaption.textContent = img.dataset.alt || img.alt || '';
    lightboxCounter.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  function navigate(direction) {
    currentIndex = (currentIndex + direction + images.length) % images.length;
    updateLightbox();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'Tab') trapFocus(e);
  }

  function trapFocus(e) {
    const focusableElements = lightbox.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  // Event listeners
  images.forEach((img, index) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLightbox(index));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });
    // Add tabindex for keyboard accessibility
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `View ${img.dataset.alt || img.alt || 'image'} in lightbox`);
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => navigate(-1));
  nextBtn.addEventListener('click', () => navigate(1));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  // Swipe support for mobile
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      navigate(diff > 0 ? 1 : -1);
    }
  }, { passive: true });
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGalleryLightbox);
} else {
  initGalleryLightbox();
}