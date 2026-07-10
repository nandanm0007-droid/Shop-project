/**
 * Shalimar Atelier - Booking Flow Module
 * Handles the 3-step booking wizard: Barber → Date/Time → Confirm
 */

// Barber data
const BARBERS = [
  {
    id: 'julian-vance',
    name: 'Julian Vance',
    title: 'Master Stylist',
    specialties: ['Beards', 'Classic'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgw70NEb21N3yNySG7VjKiecrE5g9V4jfcjvT97tI3HyRhiaKxeCAcVVu-H-hyd4YDchCUUPcKQXUc6s5iDs1bU7irPyibmd8icYdZCSy_ieA1idshDggRqjpQFTNGS0C8DytZRm3I-rdzWXEP5VJ9eDjF7D_n77LKv8QOp0gYld5TodqbIU871tS-5iLpfbQUehAKDJob1FMInlGIFkoqt6Hke0O8hf5fYphLNXIY3k3AiVCebk4edL3t5giRuq_sj8GDT2FPUNE',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZiEG5Hsjks3crtgZ0P-dRsVLC2uiQh2mR3jmiRhKw0FdHX2MDi5nRAesFdnyhMN_QuO76FyVGYjjmxI-tIzFjjSVDSXPwJ_2PJa3Od5gv2JP_1TJKBog3ZGiBOv4Y7gAZir15KJaVkRS4kdtIwHyIzLa4HOmSFLCJoeB-WlSqOks_ReSVDxnGRsKOvBavB11L_nHBJ1uhoufBlQnvK1T5drnGAqWat_HS9zU-GcNpeQ20078HHaoIOvccrcqm60pSCSgHLQl5yw'
  },
  {
    id: 'elias-thorne',
    name: 'Elias Thorne',
    title: 'Texture Specialist',
    specialties: ['Modern', 'Fade'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSRkj5SVGrc1VyNB3aRtAQoOGa4fMsqsX0ELBZ2b0ZHs7FyQ_R0oEcTlUcanB2kSJ9DqSzEex_4WFTXyeVWL80st84c29Dg6n9WbzQJaH1ieMWkJW-au_D4oIfY1tM6dOJsKFyHk6YkpYqatjmP24kPURJSz067ZzD1PDiiocwAFnQEjAkxiVWoGD0Gc736xol5CQWorfsLepC9milvxxJg8UUfoPdtPVYd_-YQEvVzxNXbzc5hiZaNRggRVUONJoXvwwiNcuGTZw',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZiEG5Hsjks3crtgZ0P-dRsVLC2uiQh2mR3jmiRhKw0FdHX2MDi5nRAesFdnyhMN_QuO76FyVGYjjmxI-tIzFjjSVDSXPwJ_2PJa3Od5gv2JP_1TJKBog3ZGiBOv4Y7gAZir15KJaVkRS4kdtIwHyIzLa4HOmSFLCJoeB-WlSqOks_ReSVDxnGRsKOvBavB11L_nHBJ1uhoufBlQnvK1T5drnGAqWat_HS9zU-GcNpeQ20078HHaoIOvccrcqm60pSCSgHLQl5yw'
  },
  {
    id: 'marcus-reed',
    name: 'Marcus Reed',
    title: 'Creative Director',
    specialties: ['Executive', 'Consult'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVFy2MLhVvEQEbFnzhSRodh6qd8bUZ_27hKGx8CJ8ig61lPPqjvLlWEiINFReAoDvHKPs8hE4ViITe2qFVPz3CjcxS2PAKtgwfTKtPuuwymzCD9C6K2EUPX63d-s0ecHLfXkAnmGGXkpb47rYjGUIs1HwmYv3gZlfaGVp-U3ARema3TlvYL81jki4rGU0CpXkzS6L8SHKiSr6TOYQo9Np-GRjWYHaFyiZUaYZ1gjvomUwktzARxTuwdht6Xlz5rhapRupQ5M45NAY',
    thumbnail: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARZiEG5Hsjks3crtgZ0P-dRsVLC2uiQh2mR3jmiRhKw0FdHX2MDi5nRAesFdnyhMN_QuO76FyVGYjjmxI-tIzFjjSVDSXPwJ_2PJa3Od5gv2JP_1TJKBog3ZGiBOv4Y7gAZir15KJaVkRS4kdtIwHyIzLa4HOmSFLCJoeB-WlSqOks_ReSVDxnGRsKOvBavB11L_nHBJ1uhoufBlQnvK1T5drnGAqWat_HS9zU-GcNpeQ20078HHaoIOvccrcqm60pSCSgHLQl5yw'
  }
];

// Time slots configuration
const TIME_SLOTS = [
  '09:00 AM', '10:30 AM', '11:45 AM',
  '01:15 PM', '02:30 PM', '04:00 PM',
  '05:30 PM', '06:45 PM'
];

// Service configuration
const SERVICE = {
  name: 'The Signature Cut & Style',
  price: 75,
  duration: '45 Mins'
};

// Booking state
let bookingState = {
  step: 1,
  selectedBarber: null,
  selectedDate: null,
  selectedTime: null,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear()
};

// DOM Elements
let elements = {};

// Initialize the booking module
export function initBooking() {
  cacheElements();
  bindEvents();
  renderCalendar();
  updateSummary();
  updateStepVisibility();
}

// Cache DOM elements
function cacheElements() {
  elements = {
    // Barber cards
    barberCards: document.querySelectorAll('[data-barber-id]'),
    // Calendar
    monthYearLabel: document.querySelector('.calendar-month-year'),
    prevMonthBtn: document.querySelector('[data-action="prev-month"]'),
    nextMonthBtn: document.querySelector('[data-action="next-month"]'),
    calendarGrid: document.querySelector('.calendar-days-grid'),
    // Time slots
    timeSlotButtons: document.querySelectorAll('[data-time-slot]'),
    // Summary
    summaryBarberName: document.querySelector('[data-summary="barber-name"]'),
    summaryBarberImage: document.querySelector('[data-summary="barber-image"]'),
    summaryDateTime: document.querySelector('[data-summary="date-time"]'),
    summaryTotal: document.querySelector('[data-summary="total"]'),
    // Confirm button
    confirmBtn: document.querySelector('[data-action="confirm-booking"]'),
    // Steps
    step1: document.querySelector('[data-step="1"]'),
    step2: document.querySelector('[data-step="2"]'),
    stepIndicators: document.querySelectorAll('[data-step-indicator]')
  };
}

// Bind event listeners
function bindEvents() {
  // Barber selection
  elements.barberCards.forEach(card => {
    card.addEventListener('click', () => selectBarber(card.dataset.barberId));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectBarber(card.dataset.barberId);
      }
    });
  });

  // Calendar navigation
  if (elements.prevMonthBtn) {
    elements.prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
  }
  if (elements.nextMonthBtn) {
    elements.nextMonthBtn.addEventListener('click', () => navigateMonth(1));
  }

  // Time slot selection
  elements.timeSlotButtons.forEach(btn => {
    btn.addEventListener('click', () => selectTimeSlot(btn.dataset.timeSlot));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTimeSlot(btn.dataset.timeSlot);
      }
    });
  });

  // Confirm booking
  if (elements.confirmBtn) {
    elements.confirmBtn.addEventListener('click', confirmBooking);
  }
}

// Step 1: Barber Selection
function selectBarber(barberId) {
  const barber = BARBERS.find(b => b.id === barberId);
  if (!barber) return;

  bookingState.selectedBarber = barber;
  bookingState.step = 2;

  // Update UI
  elements.barberCards.forEach(card => {
    const isSelected = card.dataset.barberId === barberId;
    card.classList.toggle('border-primary/40', isSelected);
    card.classList.toggle('bg-surface-container-high', isSelected);
    card.classList.toggle('bg-surface-container-low', !isSelected);
    const checkIcon = card.querySelector('.material-symbols-outlined');
    if (checkIcon) {
      checkIcon.style.opacity = isSelected ? '1' : '0';
    }
  });

  updateSummary();
  updateStepVisibility();
  renderCalendar();

  // Smooth scroll to step 2
  elements.step2?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Step 2: Calendar Navigation
function navigateMonth(delta) {
  bookingState.currentMonth += delta;
  if (bookingState.currentMonth < 0) {
    bookingState.currentMonth = 11;
    bookingState.currentYear--;
  } else if (bookingState.currentMonth > 11) {
    bookingState.currentMonth = 0;
    bookingState.currentYear++;
  }
  renderCalendar();
}

function renderCalendar() {
  if (!elements.calendarGrid || !elements.monthYearLabel) return;

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  elements.monthYearLabel.textContent = `${monthNames[bookingState.currentMonth]} ${bookingState.currentYear}`;

  const firstDay = new Date(bookingState.currentYear, bookingState.currentMonth, 1).getDay();
  const daysInMonth = new Date(bookingState.currentYear, bookingState.currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(bookingState.currentYear, bookingState.currentMonth, 0).getDate();

  let html = '';

  // Previous month filler days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    html += `<div class="h-10 flex items-center justify-center text-outline-variant opacity-20 cursor-not-allowed" data-day="${day}" data-month="prev">${day}</div>`;
  }

  // Current month days
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(bookingState.currentYear, bookingState.currentMonth, day);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isSelected = bookingState.selectedDate &&
      bookingState.selectedDate.getDate() === day &&
      bookingState.selectedDate.getMonth() === bookingState.currentMonth &&
      bookingState.selectedDate.getFullYear() === bookingState.currentYear;
    const isToday = date.toDateString() === today.toDateString();

    let classes = 'h-10 flex items-center justify-center rounded-lg text-sm transition-all';
    let dataAttrs = `data-day="${day}" data-month="current"`;

    if (isPast) {
      classes += ' text-outline-variant opacity-40 cursor-not-allowed';
    } else if (isSelected) {
      classes += ' bg-primary text-on-primary font-bold shadow-lg shadow-primary/20';
    } else if (isToday) {
      classes += ' bg-surface-container-highest text-on-surface font-medium hover:bg-primary/20 hover:text-primary cursor-pointer';
    } else {
      classes += ' hover:bg-surface-container-highest cursor-pointer text-on-surface';
    }

    html += `<div class="${classes}" ${dataAttrs}>${day}</div>`;
  }

  elements.calendarGrid.innerHTML = html;

  // Bind click events for new calendar days
  elements.calendarGrid.querySelectorAll('[data-month="current"]:not(.cursor-not-allowed)').forEach(dayEl => {
    dayEl.addEventListener('click', () => selectDate(parseInt(dayEl.dataset.day)));
    dayEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectDate(parseInt(dayEl.dataset.day));
      }
    });
  });
}

function selectDate(day) {
  const date = new Date(bookingState.currentYear, bookingState.currentMonth, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) return; // Don't allow past dates

  bookingState.selectedDate = date;
  renderCalendar();
  updateSummary();
}

// Time slot selection
function selectTimeSlot(time) {
  bookingState.selectedTime = time;

  elements.timeSlotButtons.forEach(btn => {
    const isSelected = btn.dataset.timeSlot === time;
    btn.classList.toggle('bg-primary', isSelected);
    btn.classList.toggle('text-on-primary', isSelected);
    btn.classList.toggle('border-primary', isSelected);
    btn.classList.toggle('shadow-lg', isSelected);
    btn.classList.toggle('shadow-primary/10', isSelected);
    btn.classList.toggle('bg-surface-container-highest', !isSelected);
    btn.classList.toggle('text-on-surface-variant', !isSelected);
  });

  updateSummary();
}

// Update summary panel
function updateSummary() {
  // Barber
  if (elements.summaryBarberName && elements.summaryBarberImage) {
    if (bookingState.selectedBarber) {
      elements.summaryBarberName.textContent = bookingState.selectedBarber.name;
      elements.summaryBarberImage.src = bookingState.selectedBarber.thumbnail;
      elements.summaryBarberImage.alt = bookingState.selectedBarber.name;
    } else {
      elements.summaryBarberName.textContent = '—';
      elements.summaryBarberImage.src = '';
    }
  }

  // Date & Time
  if (elements.summaryDateTime) {
    if (bookingState.selectedDate && bookingState.selectedTime) {
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      const dateStr = bookingState.selectedDate.toLocaleDateString('en-US', options);
      elements.summaryDateTime.textContent = `${dateStr} • ${bookingState.selectedTime}`;
    } else if (bookingState.selectedDate) {
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      const dateStr = bookingState.selectedDate.toLocaleDateString('en-US', options);
      elements.summaryDateTime.textContent = `${dateStr} • Select time`;
    } else {
      elements.summaryDateTime.textContent = 'Select date & time';
    }
  }

  // Total
  if (elements.summaryTotal) {
    elements.summaryTotal.textContent = `$${SERVICE.price.toFixed(2)}`;
  }

  // Enable/disable confirm button
  const isComplete = bookingState.selectedBarber && bookingState.selectedDate && bookingState.selectedTime;
  if (elements.confirmBtn) {
    elements.confirmBtn.disabled = !isComplete;
    elements.confirmBtn.style.opacity = isComplete ? '1' : '0.5';
    elements.confirmBtn.style.cursor = isComplete ? 'pointer' : 'not-allowed';
  }
}

// Update step visibility indicators
function updateStepVisibility() {
  elements.stepIndicators.forEach(indicator => {
    const step = parseInt(indicator.dataset.stepIndicator);
    indicator.classList.toggle('text-primary', step <= bookingState.step);
    indicator.classList.toggle('text-outline-variant', step > bookingState.step);
  });
}

// Confirm booking
function confirmBooking() {
  if (!bookingState.selectedBarber || !bookingState.selectedDate || !bookingState.selectedTime) {
    return;
  }

  const bookingData = {
    barber: bookingState.selectedBarber,
    service: SERVICE,
    date: bookingState.selectedDate,
    time: bookingState.selectedTime,
    total: SERVICE.price,
    bookingId: generateBookingId(),
    timestamp: new Date().toISOString()
  };

  // Show confirmation modal
  showConfirmationModal(bookingData);

  // In a real app, you would send this to your backend:
  // fetch('/api/bookings', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(bookingData)
  // });
}

function generateBookingId() {
  return 'SHL-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function showConfirmationModal(bookingData) {
  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  const dateStr = bookingData.date.toLocaleDateString('en-US', options);

  const modalHtml = `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="booking-modal">
      <div class="bg-surface-container-high rounded-2xl p-8 max-w-md w-full border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-300">
        <div class="text-center mb-8">
          <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span class="material-symbols-outlined text-primary text-4xl" style="font-variation-settings: 'FILL' 1;">check_circle</span>
          </div>
          <h3 class="font-notoSerif text-2xl text-on-surface">Appointment Confirmed!</h3>
          <p class="text-on-surface-variant mt-2">Your booking has been secured</p>
        </div>

        <div class="bg-surface-container-low rounded-xl p-6 mb-6 space-y-4">
          <div class="flex justify-between">
            <span class="text-on-surface-variant text-sm">Booking ID</span>
            <span class="font-manrope font-bold text-primary">${bookingData.bookingId}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-on-surface-variant text-sm">Service</span>
            <span class="font-manrope text-sm text-on-surface">${bookingData.service.name}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-on-surface-variant text-sm">Barber</span>
            <span class="font-manrope text-sm text-on-surface">${bookingData.barber.name}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-on-surface-variant text-sm">Date & Time</span>
            <span class="font-manrope text-sm text-on-surface">${dateStr} • ${bookingData.time}</span>
          </div>
          <div class="flex justify-between border-t border-outline-variant/20 pt-4">
            <span class="font-notoSerif text-on-surface uppercase tracking-widest">Total</span>
            <span class="text-primary font-bold">$${bookingData.total.toFixed(2)}</span>
          </div>
        </div>

        <p class="text-[10px] text-center text-on-surface-variant uppercase tracking-wider opacity-60 mb-6">
          Cancel up to 24 hours in advance without fee
        </p>

        <button class="w-full py-4 rounded-lg bg-gradient-to-r from-primary to-primary-container text-on-primary font-manrope font-extrabold uppercase tracking-[0.2em] text-xs hover:shadow-[0_10px_30px_rgba(242,202,80,0.3)] active:scale-95 transition-all duration-300" id="modal-close-btn">
          Done
        </button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('booking-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  const closeModal = () => {
    modal.classList.add('animate-out', 'fade-out', 'duration-200');
    setTimeout(() => modal.remove(), 200);
    resetBooking();
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

function resetBooking() {
  bookingState = {
    step: 1,
    selectedBarber: null,
    selectedDate: null,
    selectedTime: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
  };

  // Reset barber cards
  elements.barberCards.forEach(card => {
    card.classList.remove('border-primary/40', 'bg-surface-container-high');
    card.classList.add('bg-surface-container-low');
    const checkIcon = card.querySelector('.material-symbols-outlined');
    if (checkIcon) checkIcon.style.opacity = '0';
  });

  // Reset time slots
  elements.timeSlotButtons.forEach(btn => {
    btn.classList.remove('bg-primary', 'text-on-primary', 'border-primary', 'shadow-lg', 'shadow-primary/10');
    btn.classList.add('bg-surface-container-highest', 'text-on-surface-variant');
  });

  renderCalendar();
  updateSummary();
  updateStepVisibility();

  // Scroll back to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Auto-initialize if on book-now page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBooking);
} else {
  initBooking();
}