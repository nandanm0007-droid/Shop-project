/**
 * Shalimar Atelier — Dashboard Module
 * Loads and renders user bookings, handles profile settings.
 */

import { getUser, updateProfile, logout, requireAuth } from './auth.js';
import { toast } from './toast.js';

const BOOKINGS_KEY = 'shalimar-bookings';

function getBookings(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(BOOKINGS_KEY)) || [];
    return all.filter(b => b.userId === userId);
  } catch {
    return [];
  }
}

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'confirmed':  return { bg: 'rgba(76,175,125,0.12)', color: '#4caf7d', label: 'Confirmed' };
    case 'completed':  return { bg: 'rgba(100,181,246,0.12)', color: '#64b5f6', label: 'Completed' };
    case 'cancelled':  return { bg: 'rgba(239,83,80,0.12)', color: '#ef5350', label: 'Cancelled' };
    default:           return { bg: 'rgba(242,202,80,0.12)', color: '#f2ca50', label: 'Pending' };
  }
}

function renderBookingCard(booking) {
  const status = getStatusClass(booking.status || 'confirmed');
  const dateStr = booking.dateStr || formatDate(booking.timestamp);
  return `
    <div style="
      background:#201f1f;border:1px solid rgba(77,70,53,0.2);
      border-radius:0.75rem;padding:1.25rem 1.5rem;
      display:flex;flex-wrap:wrap;align-items:center;gap:1rem;
      justify-content:space-between;
    ">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
          <span class="material-symbols-outlined" style="color:#f2ca50;font-size:1rem;">content_cut</span>
          <p style="font-family:'Noto Serif',serif;font-size:1rem;color:#e5e2e1;margin:0;">${booking.serviceName || 'Service'}</p>
        </div>
        <p style="font-family:Manrope,sans-serif;font-size:0.8125rem;color:#d0c5af;margin:0;">
          ${booking.barberName || 'Barber'} &nbsp;·&nbsp; ${dateStr}
          ${booking.time ? `&nbsp;·&nbsp; ${booking.time}` : ''}
        </p>
        <p style="font-family:Manrope,sans-serif;font-size:0.75rem;color:#99907c;margin:0.25rem 0 0;letter-spacing:0.05em;">
          ID: ${booking.bookingId || '—'}
        </p>
      </div>
      <div style="display:flex;align-items:center;gap:1rem;flex-shrink:0;">
        <span style="
          background:${status.bg};color:${status.color};
          padding:0.25rem 0.75rem;border-radius:9999px;
          font-family:Manrope,sans-serif;font-size:0.6875rem;
          font-weight:700;letter-spacing:0.08em;text-transform:uppercase;
        ">${status.label}</span>
        <span style="font-family:'Noto Serif',serif;font-size:1rem;font-weight:700;color:#f2ca50;">
          ₹${(booking.total || 0).toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  `;
}

export function initDashboard() {
  // Guard: redirect to login if not authenticated
  if (!requireAuth()) return;

  const user = getUser();
  const bookings = getBookings(user.id);

  // Render user info
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name);
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);
  document.querySelectorAll('[data-user-initials]').forEach(el => {
    el.textContent = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  });
  document.querySelectorAll('[data-user-joined]').forEach(el => {
    el.textContent = `Member since ${new Date(user.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
  });

  // Render stats
  const upcoming = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed').length;
  const completed = bookings.filter(b => b.status === 'completed').length;
  document.querySelectorAll('[data-stat-upcoming]').forEach(el => el.textContent = upcoming);
  document.querySelectorAll('[data-stat-completed]').forEach(el => el.textContent = completed);
  document.querySelectorAll('[data-stat-total]').forEach(el => el.textContent = bookings.length);

  // Render bookings list
  const bookingList = document.getElementById('booking-list');
  if (bookingList) {
    if (bookings.length === 0) {
      bookingList.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <span class="material-symbols-outlined" style="color:#4d4635;font-size:3rem;display:block;margin-bottom:1rem;">calendar_today</span>
          <p style="font-family:'Noto Serif',serif;font-size:1.25rem;color:#e5e2e1;margin-bottom:0.5rem;">No appointments yet</p>
          <p style="font-family:Manrope,sans-serif;font-size:0.875rem;color:#99907c;margin-bottom:1.5rem;">Book your first session at the atelier.</p>
          <a href="/book-now.html" style="
            display:inline-block;
            background:linear-gradient(135deg,#f2ca50,#d4af37);
            color:#3c2f00;font-family:Manrope,sans-serif;font-weight:800;
            font-size:0.75rem;letter-spacing:0.15em;text-transform:uppercase;
            padding:0.875rem 2rem;border-radius:9999px;text-decoration:none;
            transition:box-shadow 0.3s;
          ">Book Now</a>
        </div>
      `;
    } else {
      bookingList.innerHTML = bookings
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(renderBookingCard)
        .join('');
    }
  }

  // Profile form
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    // Pre-fill fields
    const nameInput = profileForm.querySelector('[name="name"]');
    const emailInput = profileForm.querySelector('[name="email"]');
    if (nameInput) nameInput.value = user.name;
    if (emailInput) emailInput.value = user.email;

    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(profileForm);
      const result = updateProfile({
        name: formData.get('name'),
        email: formData.get('email'),
      });
      if (result.success) {
        toast.success(result.message, { title: 'Profile Updated' });
        // Refresh name display
        document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = formData.get('name'));
        const initials = formData.get('name').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        document.querySelectorAll('[data-user-initials]').forEach(el => el.textContent = initials);
      } else {
        toast.error(result.message, { title: 'Update Failed' });
      }
    });
  }

  // Logout button
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
      toast.info('You have been logged out.', { duration: 2000 });
      setTimeout(() => { window.location.href = '/'; }, 1200);
    });
  });
}
