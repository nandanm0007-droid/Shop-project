const API_BASE = window.location.origin.includes('localhost:5173')
  ? 'http://localhost:3000'
  : '';

export function getToken() {
  const auth = localStorage.getItem('shalimar-auth');
  if (!auth) return null;
  try {
    return JSON.parse(auth).token;
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem('shalimar-auth', JSON.stringify({ token, user }));
}

export function clearAuth() {
  localStorage.removeItem('shalimar-auth');
}

export async function apiRequest(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const json = await res.json();

  if (!res.ok) {
    if (res.status === 401 && path !== '/api/auth/refresh' && path !== '/api/auth/login') {
      const refreshed = await refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${getToken()}`;
        const retryRes = await fetch(`${API_BASE}${path}`, {
          method, headers, body: body ? JSON.stringify(body) : undefined, credentials: 'include',
        });
        const retryJson = await retryRes.json();
        if (retryRes.ok) return retryJson.data;
      }
      clearAuth();
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    }
    throw new Error(json.error?.message || 'Request failed');
  }

  return json.data;
}

// Auth API
export async function register({ name, email, password }) {
  const data = await apiRequest('POST', '/api/auth/register', { name, email, password });
  if (data?.accessToken) {
    setAuth(data.accessToken, data.user);
  }
  return data;
}

export async function login({ email, password }) {
  const data = await apiRequest('POST', '/api/auth/login', { email, password });
  if (data?.accessToken) {
    setAuth(data.accessToken, data.user);
  }
  return data;
}

export async function logout() {
  return apiRequest('POST', '/api/auth/logout');
}

export async function refreshToken() {
  try {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
    const json = await res.json();
    if (res.ok && json.data) {
      setAuth(json.data.token, json.data.user);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getProfile() {
  return apiRequest('GET', '/api/auth/me');
}

export async function updateProfile({ name, phone }) {
  return apiRequest('PATCH', '/api/auth/profile', { name, phone });
}

export async function changePassword({ currentPassword, newPassword }) {
  return apiRequest('POST', '/api/auth/change-password', { currentPassword, newPassword });
}

export async function forgotPassword({ email }) {
  return apiRequest('POST', '/api/auth/forgot-password', { email });
}

export async function resetPassword({ token, password }) {
  return apiRequest('POST', '/api/auth/reset-password', { token, password });
}

// Services API
export async function getServices(category) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiRequest('GET', `/api/services${query}`);
}

export async function getService(slug) {
  return apiRequest('GET', `/api/services/${slug}`);
}

// Barbers API
export async function getBarbers() {
  return apiRequest('GET', '/api/barbers');
}

// Bookings API
export async function createBooking({ serviceId, barberId, date, time, notes }) {
  return apiRequest('POST', '/api/bookings', { serviceId, barberId, date, time, notes });
}

export async function getBookings({ status, page, limit } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiRequest('GET', `/api/bookings${query}`);
}

export async function getBooking(id) {
  return apiRequest('GET', `/api/bookings/${id}`);
}

export async function cancelBooking(id) {
  return apiRequest('DELETE', `/api/bookings/${id}`);
}

export async function checkAvailability({ barberId, date, time }) {
  return apiRequest('POST', '/api/bookings/check-availability', { barberId, date, time });
}

// Gallery API
export async function getGalleryItems() {
  return apiRequest('GET', '/api/gallery');
}

// Health API
export async function healthCheck() {
  return apiRequest('GET', '/api/health');
}
