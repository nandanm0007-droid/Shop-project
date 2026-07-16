/**
 * Shalimar Atelier — Booking Flow Module (v2)
 * Steps: Service → Barber → Date/Time → Confirm
 * Features: Toast notifications, localStorage persistence, loading states
 */

import { toast } from './toast.js';
import { getUser } from './auth.js';

// ── Data ────────────────────────────────────────────────────────────────

const SERVICES = [
  { id: 'signature-cut',    name: 'The Signature Cut',     price: 150, duration: '45 Mins', icon: 'content_cut',  category: 'Haircuts' },
  { id: 'executive-fade',   name: 'The Executive Fade',    price: 200, duration: '45 Mins', icon: 'face',         category: 'Haircuts' },
  { id: 'long-form',        name: 'Long Form Grooming',    price: 150, duration: '60 Mins', icon: 'straighten',   category: 'Haircuts' },
  { id: 'hot-towel-shave',  name: 'Hot Towel Shave',       price: 100, duration: '40 Mins', icon: 'water_drop',   category: 'Beard & Shave' },
  { id: 'beard-sculpt',     name: 'Atelier Beard Sculpt',  price: 100, duration: '30 Mins', icon: 'spa',          category: 'Beard & Shave' },
  { id: 'atelier-exp',      name: 'The Atelier Experience',price: 450, duration: '90 Mins', icon: 'star',         category: 'Premium', featured: true },
  { id: 'revitalizing',     name: 'Revitalizing Facial',   price: 350, duration: '45 Mins', icon: 'self_improvement'},
  { id: 'scalp-detox',      name: 'Scalp Detox Treatment', price: 200, duration: '25 Mins', icon: 'air'},
];

const BARBERS = [
  {
    id: 'Murthy',
    name: 'Murthy',
    title: 'Master Stylist',
    specialties: ['Beards', 'Classic'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgw70NEb21N3yNySG7VjKiecrE5g9V4jfcjvT97tI3HyRhiaKxeCAcVVu-H-hyd4YDchCUUPcKQXUc6s5iDs1bU7irPyibmd8icYdZCSy_ieA1idshDggRqjpQFTNGS0C8DytZRm3I-rdzWXEP5VJ9eDjF7D_n77LKv8QOp0gYld5TodqbIU871tS-5iLpfbQUehAKDJob1FMInlGIFkoqt6Hke0O8hf5fYphLNXIY3k3AiVCebk4edL3t5giRuq_sj8GDT2FPUNE',
  },
  {
    id: 'elias-thorne',
    name: 'Murugesh',
    title: 'Texture Specialist',
    specialties: ['Modern', 'Fade'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSRkj5SVGrc1VyNB3aRtAQoOGa4fMsqsX0ELBZ2b0ZHs7FyQ_R0oEcTlUcanB2kSJ9DqSzEex_4WFTXyeVWL80st84c29Dg6n9WbzQJaH1ieMWkJW-au_D4oIfY1tM6dOJsKFyHk6YkpYqatjmP24kPURJSz067ZzD1PDiiocwAFnQEjAkxiVWoGD0Gc736xol5CQWorfsLepC9milvxxJg8UUfoPdtPVYd_-YQEvVzxNXbzc5hiZaNRggRVUONJoXvwwiNcuGTZw',
  },
  {
    id: 'marcus-reed',
    name: 'Omkesh',
    title: 'Creative Director',
    specialties: ['Executive', 'Consult'],
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVFy2MLhVvEQEbFnzhSRodh6qd8bUZ_27hKGx8CJ8ig61lPPqjvLlWEiINFReAoDvHKPs8hE4ViITe2qFVPz3CjcxS2PAKtgwfTKtPuuwymzCD9C6K2EUPX63d-s0ecHLfXkAnmGGXkpb47rYjGUIs1HwmYv3gZlfaGVp-U3ARema3TlvYL81jki4rGU0CpXkzS6L8SHKiSr6TOYQo9Np-GRjWYHaFyiZUaYZ1gjvomUwktzARxTuwdht6Xlz5rhapRupQ5M45NAY',
  },
];

const TIME_SLOTS = [
  '09:00 AM', '10:30 AM', '11:45 AM',
  '01:15 PM', '02:30 PM', '04:00 PM',
  '05:30 PM', '06:45 PM',
];

// Simulate "booked" slots
const UNAVAILABLE_SLOTS = ['05:30 PM', '06:45 PM'];

// ── State ────────────────────────────────────────────────────────────────

let state = {
  step: 1,
  selectedService: null,
  selectedBarber: null,
  selectedDate: null,
  selectedTime: null,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
};

// ── Init ─────────────────────────────────────────────────────────────────

export function initBooking() {
  // Pre-select a service if passed via URL param
  const params = new URLSearchParams(window.location.search);
  const preService = params.get('service');

  renderServiceCards(preService);
  renderBarberCards();
  renderTimeSlots();
  renderCalendar();
  updateSummary();
  updateStepIndicators();

  // Pre-select service from URL
  if (preService) {
    const svc = SERVICES.find(s => s.id === preService);
    if (svc) {
      state.selectedService = svc;
      updateSummary();
      updateStepIndicators();
    }
  }

  // Confirm button
  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) confirmBtn.addEventListener('click', confirmBooking);

  // Step navigation buttons
  document.querySelectorAll('[data-next-step]').forEach(btn => {
    btn.addEventListener('click', () => advanceToStep(parseInt(btn.dataset.nextStep)));
  });
  document.querySelectorAll('[data-prev-step]').forEach(btn => {
    btn.addEventListener('click', () => advanceToStep(parseInt(btn.dataset.prevStep)));
  });
}

// ── Rendering ─────────────────────────────────────────────────────────────

function renderServiceCards(preSelectedId = null) {
  const grid = document.getElementById('service-cards');
  if (!grid) return;

  grid.innerHTML = SERVICES.map(svc => `
    <div
      class="service-card group"
      data-service-id="${svc.id}"
      role="button"
      tabindex="0"
      aria-label="Select ${svc.name}"
      style="
        background:#1c1b1b;border:1px solid rgba(77,70,53,0.2);
        border-radius:0.75rem;padding:1.25rem 1.5rem;cursor:pointer;
        transition:all 0.3s ease;position:relative;
        ${svc.featured ? 'border-color:rgba(242,202,80,0.4);background:rgba(242,202,80,0.04);' : ''}
        ${preSelectedId === svc.id ? 'border-color:rgba(242,202,80,0.5);background:#201f1f;' : ''}
      "
    >
      ${svc.featured ? `<span style="
        position:absolute;top:-0.6rem;left:1rem;
        background:#f2ca50;color:#3c2f00;font-family:Manrope,sans-serif;
        font-size:0.6rem;font-weight:800;letter-spacing:0.12em;
        text-transform:uppercase;padding:0.15rem 0.6rem;border-radius:9999px;
      ">Premium</span>` : ''}
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.75rem;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.35rem;">
            <span class="material-symbols-outlined" style="color:#f2ca50;font-size:1.125rem;">${svc.icon}</span>
            <h3 style="font-family:'Noto Serif',serif;font-size:0.9375rem;color:#e5e2e1;margin:0;">${svc.name}</h3>
          </div>
          <p style="font-family:Manrope,sans-serif;font-size:0.75rem;color:#99907c;margin:0;letter-spacing:0.04em;">${svc.duration} &nbsp;·&nbsp; ${svc.category}</p>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <p style="font-family:'Noto Serif',serif;font-size:1.125rem;font-weight:700;color:#f2ca50;margin:0;">₹${svc.price}</p>
          <span class="svc-check" style="
            display:${preSelectedId === svc.id ? 'flex' : 'none'};
            align-items:center;justify-content:center;
            color:#f2ca50;font-size:0.75rem;margin-top:0.25rem;
          ">
            <span class="material-symbols-outlined" style="font-size:1rem;font-variation-settings:'FILL' 1;">check_circle</span>
          </span>
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => selectService(card.dataset.serviceId));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectService(card.dataset.serviceId); }
    });
  });
}

function renderBarberCards() {
  const grid = document.getElementById('barber-cards');
  if (!grid) return;

  grid.innerHTML = BARBERS.map(b => `
    <div
      class="barber-card group"
      data-barber-id="${b.id}"
      role="button"
      tabindex="0"
      aria-label="Select ${b.name}"
      style="
        background:#1c1b1b;border:1px solid rgba(77,70,53,0.2);
        border-radius:0.75rem;overflow:hidden;cursor:pointer;
        transition:all 0.3s ease;position:relative;
        display:flex;align-items:center;gap:0;
      "
    >
      <div style="width:5rem;height:5rem;flex-shrink:0;overflow:hidden;">
        <img src="${b.image}" alt="${b.name}"
          style="width:100%;height:100%;object-fit:cover;filter:grayscale(100%);transition:filter 0.5s ease;"
          loading="lazy"
        />
      </div>
      <div style="padding:0.875rem 1rem;flex:1;min-width:0;">
        <h3 style="font-family:'Noto Serif',serif;font-size:1rem;color:#f2ca50;margin:0 0 0.2rem;">${b.name}</h3>
        <p style="font-family:Manrope,sans-serif;font-size:0.6875rem;color:#99907c;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 0.5rem;">${b.title}</p>
        <div style="display:flex;gap:0.375rem;flex-wrap:wrap;">
          ${b.specialties.map(s => `
            <span style="
              background:rgba(77,70,53,0.3);color:#d0c5af;
              font-family:Manrope,sans-serif;font-size:0.625rem;
              text-transform:uppercase;letter-spacing:0.08em;
              padding:0.15rem 0.5rem;border-radius:0.25rem;
            ">${s}</span>
          `).join('')}
        </div>
      </div>
      <div class="barber-check" style="
        position:absolute;top:0.75rem;right:0.75rem;
        opacity:0;transition:opacity 0.2s;
      ">
        <span class="material-symbols-outlined" style="color:#f2ca50;font-size:1.25rem;font-variation-settings:'FILL' 1;">check_circle</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.barber-card').forEach(card => {
    card.addEventListener('click', () => selectBarber(card.dataset.barberId));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectBarber(card.dataset.barberId); }
    });
  });
}

function renderTimeSlots() {
  const grid = document.getElementById('time-slots');
  if (!grid) return;

  grid.innerHTML = TIME_SLOTS.map(slot => {
    const unavailable = UNAVAILABLE_SLOTS.includes(slot);
    return `
      <button
        class="time-slot-btn"
        data-time="${slot}"
        ${unavailable ? 'disabled aria-disabled="true"' : ''}
        style="
          padding:0.625rem 0.5rem;border-radius:0.5rem;
          border:1px solid rgba(77,70,53,0.25);
          background:#1c1b1b;
          color:${unavailable ? '#4d4635' : '#d0c5af'};
          font-family:Manrope,sans-serif;font-size:0.75rem;
          font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
          cursor:${unavailable ? 'not-allowed' : 'pointer'};
          opacity:${unavailable ? '0.4' : '1'};
          transition:all 0.2s ease;
        "
      >${slot}${unavailable ? '<br><span style="font-size:0.5rem;letter-spacing:0.05em;font-weight:400;">Unavailable</span>' : ''}</button>
    `;
  }).join('');

  grid.querySelectorAll('.time-slot-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => selectTime(btn.dataset.time));
  });
}

// ── Selection Handlers ────────────────────────────────────────────────────

function selectService(id) {
  state.selectedService = SERVICES.find(s => s.id === id) || null;

  document.querySelectorAll('.service-card').forEach(card => {
    const isSelected = card.dataset.serviceId === id;
    card.style.borderColor = isSelected ? 'rgba(242,202,80,0.5)' : 'rgba(77,70,53,0.2)';
    card.style.background  = isSelected ? '#201f1f' : '#1c1b1b';
    card.querySelector('.svc-check').style.display = isSelected ? 'flex' : 'none';
  });

  updateSummary();
  updateStepIndicators();

  // Auto-scroll to barber section
  setTimeout(() => document.getElementById('step-barber')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}

function selectBarber(id) {
  state.selectedBarber = BARBERS.find(b => b.id === id) || null;

  document.querySelectorAll('.barber-card').forEach(card => {
    const isSelected = card.dataset.barberId === id;
    card.style.borderColor = isSelected ? 'rgba(242,202,80,0.5)' : 'rgba(77,70,53,0.2)';
    card.style.background  = isSelected ? '#201f1f' : '#1c1b1b';
    card.querySelector('.barber-check').style.opacity = isSelected ? '1' : '0';
    const img = card.querySelector('img');
    if (img) img.style.filter = isSelected ? 'grayscale(0%)' : 'grayscale(100%)';
  });

  updateSummary();
  updateStepIndicators();

  setTimeout(() => document.getElementById('step-datetime')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
}

function selectTime(time) {
  state.selectedTime = time;

  document.querySelectorAll('.time-slot-btn').forEach(btn => {
    const isSelected = btn.dataset.time === time;
    btn.style.background   = isSelected ? '#f2ca50' : '#1c1b1b';
    btn.style.color        = isSelected ? '#3c2f00' : '#d0c5af';
    btn.style.borderColor  = isSelected ? '#f2ca50' : 'rgba(77,70,53,0.25)';
    btn.style.fontWeight   = isSelected ? '800' : '700';
  });

  updateSummary();
}

// ── Calendar ─────────────────────────────────────────────────────────────

function renderCalendar() {
  const grid   = document.getElementById('calendar-grid');
  const label  = document.getElementById('calendar-month-label');
  const prevBtn = document.getElementById('cal-prev');
  const nextBtn = document.getElementById('cal-next');

  if (!grid || !label) return;

  const months = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  label.textContent = `${months[state.currentMonth]} ${state.currentYear}`;

  const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
  const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
  const prevDays = new Date(state.currentYear, state.currentMonth, 0).getDate();
  const today = new Date();

  let html = '';

  // Prev month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div style="height:2.25rem;display:flex;align-items:center;justify-content:center;color:#4d4635;opacity:0.4;font-size:0.875rem;">${prevDays - i}</div>`;
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(state.currentYear, state.currentMonth, day);
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isSelected = state.selectedDate &&
      state.selectedDate.getDate() === day &&
      state.selectedDate.getMonth() === state.currentMonth &&
      state.selectedDate.getFullYear() === state.currentYear;
    const isToday = date.toDateString() === today.toDateString();

    let style = 'height:2.25rem;display:flex;align-items:center;justify-content:center;border-radius:0.5rem;font-size:0.875rem;transition:all 0.2s;';
    let extra = '';

    if (isPast) {
      style += 'color:#4d4635;opacity:0.4;cursor:not-allowed;';
    } else if (isSelected) {
      style += 'background:#f2ca50;color:#3c2f00;font-weight:800;cursor:pointer;';
    } else if (isToday) {
      style += 'background:rgba(242,202,80,0.15);color:#f2ca50;font-weight:700;cursor:pointer;';
    } else {
      style += 'color:#e5e2e1;cursor:pointer;';
      extra = 'onmouseover="this.style.background=\'rgba(242,202,80,0.08)\'" onmouseout="this.style.background=\'\'"';
    }

    if (!isPast) {
      html += `<div style="${style}" ${extra} data-cal-day="${day}">${day}</div>`;
    } else {
      html += `<div style="${style}">${day}</div>`;
    }
  }

  grid.innerHTML = html;

  // Bind clicks
  grid.querySelectorAll('[data-cal-day]').forEach(el => {
    el.addEventListener('click', () => selectDate(parseInt(el.dataset.calDay)));
  });

  // Calendar nav
  if (prevBtn) {
    prevBtn.onclick = () => {
      state.currentMonth--;
      if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
      renderCalendar();
    };
  }
  if (nextBtn) {
    nextBtn.onclick = () => {
      state.currentMonth++;
      if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
      renderCalendar();
    };
  }
}

function selectDate(day) {
  const date = new Date(state.currentYear, state.currentMonth, day);
  const today = new Date(); today.setHours(0,0,0,0);
  if (date < today) return;
  state.selectedDate = date;
  renderCalendar();
  updateSummary();
}

// ── Summary Panel ─────────────────────────────────────────────────────────

function updateSummary() {
  const set = (sel, val) => document.querySelectorAll(sel).forEach(el => el.textContent = val);
  const show = (sel, visible) => document.querySelectorAll(sel).forEach(el => el.style.display = visible ? '' : 'none');

  // Service
  set('[data-summary-service]', state.selectedService ? state.selectedService.name : '—');
  set('[data-summary-price]',   state.selectedService ? `₹${state.selectedService.price}` : '—');
  set('[data-summary-total]',   state.selectedService ? `₹${state.selectedService.price}` : '₹0');
  set('[data-summary-duration]',state.selectedService ? state.selectedService.duration : '—');

  // Barber
  set('[data-summary-barber]',  state.selectedBarber ? state.selectedBarber.name : '—');
  const barberImg = document.querySelector('[data-summary-barber-img]');
  if (barberImg) {
    barberImg.src = state.selectedBarber ? state.selectedBarber.image : '';
    barberImg.style.display = state.selectedBarber ? 'block' : 'none';
  }

  // Date & Time
  let dateTimeStr = '—';
  if (state.selectedDate && state.selectedTime) {
    const opts = { weekday: 'short', month: 'short', day: 'numeric' };
    dateTimeStr = `${state.selectedDate.toLocaleDateString('en-IN', opts)} · ${state.selectedTime}`;
  } else if (state.selectedDate) {
    const opts = { weekday: 'short', month: 'short', day: 'numeric' };
    dateTimeStr = `${state.selectedDate.toLocaleDateString('en-IN', opts)} · Select time`;
  }
  set('[data-summary-datetime]', dateTimeStr);

  // Enable / disable confirm
  const isReady = state.selectedService && state.selectedBarber && state.selectedDate && state.selectedTime;
  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) {
    confirmBtn.disabled  = !isReady;
    confirmBtn.style.opacity = isReady ? '1' : '0.5';
    confirmBtn.style.cursor  = isReady ? 'pointer' : 'not-allowed';
  }
}

// ── Step Indicators ───────────────────────────────────────────────────────

function updateStepIndicators() {
  const step = state.selectedService ? (state.selectedBarber ? (state.selectedDate && state.selectedTime ? 3 : 2) : 1) : 0;
  document.querySelectorAll('[data-step-indicator]').forEach(el => {
    const s = parseInt(el.dataset.stepIndicator);
    el.style.color = s <= step ? '#f2ca50' : '#4d4635';
    el.style.borderColor = s <= step ? 'rgba(242,202,80,0.5)' : 'rgba(77,70,53,0.3)';
    el.style.background = s <= step ? 'rgba(242,202,80,0.08)' : 'transparent';
  });
}

function advanceToStep(step) {
  document.getElementById(`step-section-${step}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Confirm ───────────────────────────────────────────────────────────────

function confirmBooking() {
  if (!state.selectedService || !state.selectedBarber || !state.selectedDate || !state.selectedTime) {
    toast.warning('Please complete all steps before confirming.', { title: 'Incomplete Selection' });
    return;
  }

  const confirmBtn = document.getElementById('confirm-btn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `
      <span style="display:flex;align-items:center;justify-content:center;gap:0.5rem;">
        <span class="material-symbols-outlined" style="font-size:1rem;animation:spin 1s linear infinite;">progress_activity</span>
        Confirming...
      </span>
    `;
  }

  // Simulate network delay
  setTimeout(() => {
    const bookingId = 'SHL-' + Date.now().toString(36).toUpperCase();
    const opts = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    const dateStr = state.selectedDate.toLocaleDateString('en-IN', opts);
    const user = getUser();

    // Save to localStorage
    const booking = {
      bookingId,
      userId: user?.id || 'guest',
      serviceName: state.selectedService.name,
      barberName: state.selectedBarber.name,
      dateStr,
      time: state.selectedTime,
      total: state.selectedService.price,
      status: 'confirmed',
      timestamp: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('shalimar-bookings') || '[]');
    existing.push(booking);
    localStorage.setItem('shalimar-bookings', JSON.stringify(existing));

    // Show confirmation modal
    showConfirmationModal(booking);

    // Reset confirm button
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Confirm Appointment';
      confirmBtn.style.opacity = '0.5';
    }
  }, 1200);
}

function showConfirmationModal(booking) {
  const existing = document.getElementById('booking-success-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'booking-success-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:1rem;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);';
  modal.innerHTML = `
    <div style="
      background:#201f1f;border:1px solid rgba(242,202,80,0.2);
      border-radius:1rem;padding:2.5rem 2rem;max-width:26rem;width:100%;
      text-align:center;
      animation:scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
    ">
      <style>@keyframes scaleIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}</style>
      <div style="width:4.5rem;height:4.5rem;border-radius:50%;background:rgba(76,175,125,0.12);border:1.5px solid rgba(76,175,125,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;">
        <span class="material-symbols-outlined" style="color:#4caf7d;font-size:2rem;font-variation-settings:'FILL' 1;">check_circle</span>
      </div>
      <h3 style="font-family:'Noto Serif',serif;font-size:1.375rem;color:#e5e2e1;margin:0 0 0.5rem;">Appointment Confirmed!</h3>
      <p style="font-family:Manrope,sans-serif;font-size:0.875rem;color:#d0c5af;margin:0 0 1.5rem;">Your booking has been secured at the atelier.</p>

      <div style="background:#1c1b1b;border-radius:0.75rem;padding:1.25rem;margin-bottom:1.5rem;text-align:left;display:grid;gap:0.75rem;">
        ${[
          ['Booking ID', booking.bookingId, '#f2ca50'],
          ['Service', booking.serviceName, '#e5e2e1'],
          ['Barber', booking.barberName, '#e5e2e1'],
          ['Date & Time', `${booking.dateStr} · ${booking.time}`, '#e5e2e1'],
        ].map(([label, value, color]) => `
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:0.5rem;">
            <span style="font-family:Manrope,sans-serif;font-size:0.75rem;color:#99907c;letter-spacing:0.06em;text-transform:uppercase;">${label}</span>
            <span style="font-family:Manrope,sans-serif;font-size:0.8125rem;color:${color};font-weight:600;text-align:right;">${value}</span>
          </div>
        `).join('')}
        <div style="border-top:1px solid rgba(77,70,53,0.2);padding-top:0.75rem;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-family:'Noto Serif',serif;font-size:0.9375rem;color:#e5e2e1;letter-spacing:0.08em;text-transform:uppercase;">Total</span>
          <span style="font-family:'Noto Serif',serif;font-size:1.25rem;font-weight:700;color:#f2ca50;">₹${booking.total}</span>
        </div>
      </div>

      <p style="font-family:Manrope,sans-serif;font-size:0.7rem;color:#99907c;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:1.5rem;">
        Cancel up to 24 hours in advance without fee
      </p>

      <button id="modal-done-btn" style="
        width:100%;padding:1rem;border-radius:9999px;
        background:linear-gradient(135deg,#f2ca50,#d4af37);
        color:#3c2f00;font-family:Manrope,sans-serif;font-weight:800;
        font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;
        border:none;cursor:pointer;transition:all 0.3s;
      ">Done</button>
    </div>
  `;

  document.body.appendChild(modal);
  toast.success('Your appointment is confirmed!', { title: 'Booking Confirmed', duration: 6000 });

  document.getElementById('modal-done-btn').addEventListener('click', () => {
    modal.remove();
    resetBooking();
  });
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', esc); }
  });
}

function resetBooking() {
  state = {
    step: 1,
    selectedService: null,
    selectedBarber: null,
    selectedDate: null,
    selectedTime: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
  };
  renderServiceCards();
  renderBarberCards();
  renderTimeSlots();
  renderCalendar();
  updateSummary();
  updateStepIndicators();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Auto-init ─────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBooking);
} else {
  initBooking();
}