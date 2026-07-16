/**
 * Shalimar Atelier — Image Lightbox Module
 * Features: keyboard nav, swipe support, captions, smooth animations
 */

let lightboxEl = null;
let images = [];
let currentIndex = 0;
let startX = 0;
let isDragging = false;

/**
 * Build the lightbox DOM element (once).
 */
function buildLightbox() {
  if (lightboxEl) return;

  lightboxEl = document.createElement('div');
  lightboxEl.id = 'lightbox';
  lightboxEl.setAttribute('role', 'dialog');
  lightboxEl.setAttribute('aria-modal', 'true');
  lightboxEl.setAttribute('aria-label', 'Image viewer');
  lightboxEl.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.95);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; pointer-events: none;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(8px);
  `;

  lightboxEl.innerHTML = `
    <!-- Close Button -->
    <button id="lb-close" aria-label="Close" style="
      position:absolute;top:1rem;right:1rem;
      background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
      border-radius:50%;width:2.5rem;height:2.5rem;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;color:#e5e2e1;transition:all 0.2s;z-index:2;
    ">
      <span class="material-symbols-outlined" style="font-size:1.25rem;">close</span>
    </button>

    <!-- Prev Button -->
    <button id="lb-prev" aria-label="Previous image" style="
      position:absolute;left:1rem;top:50%;transform:translateY(-50%);
      background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
      border-radius:50%;width:3rem;height:3rem;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;color:#e5e2e1;transition:all 0.2s;z-index:2;
    ">
      <span class="material-symbols-outlined">chevron_left</span>
    </button>

    <!-- Next Button -->
    <button id="lb-next" aria-label="Next image" style="
      position:absolute;right:1rem;top:50%;transform:translateY(-50%);
      background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
      border-radius:50%;width:3rem;height:3rem;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;color:#e5e2e1;transition:all 0.2s;z-index:2;
    ">
      <span class="material-symbols-outlined">chevron_right</span>
    </button>

    <!-- Main Image -->
    <div id="lb-img-wrap" style="
      max-width:90vw;max-height:85vh;position:relative;
      display:flex;flex-direction:column;align-items:center;gap:1rem;
    ">
      <img id="lb-img" src="" alt="" style="
        max-width:100%;max-height:75vh;
        object-fit:contain;border-radius:0.5rem;
        transition:opacity 0.25s ease,transform 0.25s ease;
        user-select:none;
      " draggable="false"/>
      <!-- Caption -->
      <div id="lb-caption" style="
        color:#d0c5af;font-family:Manrope,sans-serif;
        font-size:0.8125rem;letter-spacing:0.05em;text-align:center;
        max-width:40rem;opacity:0.8;
      "></div>
      <!-- Counter -->
      <div id="lb-counter" style="
        position:absolute;bottom:-2.5rem;left:50%;transform:translateX(-50%);
        color:#99907c;font-family:Manrope,sans-serif;font-size:0.75rem;
        letter-spacing:0.1em;
      "></div>
    </div>
  `;

  document.body.appendChild(lightboxEl);

  // Event bindings
  document.getElementById('lb-close').addEventListener('click', closeLightbox);
  document.getElementById('lb-prev').addEventListener('click', showPrev);
  document.getElementById('lb-next').addEventListener('click', showNext);

  // Background click to close
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });

  // Keyboard
  document.addEventListener('keydown', handleKeyboard);

  // Touch/swipe
  const imgWrap = document.getElementById('lb-img-wrap');
  imgWrap.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDragging = true; }, { passive: true });
  imgWrap.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? showNext() : showPrev();
    isDragging = false;
  }, { passive: true });
}

function handleKeyboard(e) {
  if (!lightboxEl || lightboxEl.style.opacity === '0') return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
}

/**
 * Open the lightbox.
 * @param {Array<{src:string,alt:string,caption?:string}>} imgList
 * @param {number} startIndex
 */
export function openLightbox(imgList, startIndex = 0) {
  buildLightbox();
  images = imgList;
  currentIndex = startIndex;
  showImage(currentIndex, false);
  document.body.style.overflow = 'hidden';
  lightboxEl.style.pointerEvents = 'all';
  requestAnimationFrame(() => {
    lightboxEl.style.opacity = '1';
  });
}

export function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.style.opacity = '0';
  lightboxEl.style.pointerEvents = 'none';
  document.body.style.overflow = '';
}

function showPrev() {
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  showImage(currentIndex, true);
}

function showNext() {
  currentIndex = (currentIndex + 1) % images.length;
  showImage(currentIndex, true);
}

function showImage(index, animate = true) {
  const img = document.getElementById('lb-img');
  const caption = document.getElementById('lb-caption');
  const counter = document.getElementById('lb-counter');

  if (!img) return;

  if (animate) {
    img.style.opacity = '0';
    img.style.transform = 'scale(0.95)';
  }

  setTimeout(() => {
    const item = images[index];
    img.src = item.src;
    img.alt = item.alt || '';
    caption.textContent = item.caption || item.alt || '';
    counter.textContent = images.length > 1 ? `${index + 1} / ${images.length}` : '';

    if (animate) {
      requestAnimationFrame(() => {
        img.style.opacity = '1';
        img.style.transform = 'scale(1)';
      });
    }
  }, animate ? 180 : 0);

  // Hide prev/next on single image
  const prevBtn = document.getElementById('lb-prev');
  const nextBtn = document.getElementById('lb-next');
  if (prevBtn) prevBtn.style.display = images.length > 1 ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = images.length > 1 ? 'flex' : 'none';
}

/**
 * Initialize lightbox on all gallery items.
 * Looks for elements with [data-lightbox] and [data-lightbox-group].
 */
export function initLightbox() {
  // Collect all images in groups
  const groups = {};
  document.querySelectorAll('[data-lightbox]').forEach((el, i) => {
    const group = el.dataset.lightboxGroup || 'default';
    if (!groups[group]) groups[group] = [];
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    groups[group].push({
      src: img?.src || el.dataset.lightbox,
      alt: img?.alt || '',
      caption: el.dataset.lightboxCaption || img?.alt || '',
      el,
    });
  });

  // Attach click handlers
  document.querySelectorAll('[data-lightbox]').forEach((el) => {
    el.style.cursor = 'zoom-in';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const group = el.dataset.lightboxGroup || 'default';
      const groupItems = groups[group];
      const idx = groupItems.findIndex(item => item.el === el);
      openLightbox(groupItems.map(({ src, alt, caption }) => ({ src, alt, caption })), idx);
    });
  });
}
