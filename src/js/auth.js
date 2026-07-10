/**
 * Shalimar Atelier — Auth Module
 * Client-side authentication simulation using localStorage.
 * Simulates JWT-based auth with user session management.
 */

const AUTH_KEY   = 'shalimar-auth';
const USERS_KEY  = 'shalimar-users';
const TOKEN_PREFIX = 'SHL_TK_';

// --- Helpers ---

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

function generateToken() {
  return TOKEN_PREFIX + Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).substr(2, 8).toUpperCase();
}

function hashPassword(password) {
  // Simple obfuscation (NOT cryptographically secure — for demo only)
  return btoa(unescape(encodeURIComponent(password + '_shalimar_salt')));
}

// --- Public API ---

/**
 * Register a new user.
 * @returns {{ success: boolean, message: string, user?: object }}
 */
export function register({ name, email, password }) {
  if (!name || !email || !password) {
    return { success: false, message: 'All fields are required.' };
  }
  if (password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters.' };
  }

  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'An account with this email already exists.' };
  }

  const user = {
    id: 'user_' + Date.now().toString(36),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashPassword(password),
    createdAt: new Date().toISOString(),
    avatar: null,
    role: 'user',
  };

  users.push(user);
  saveUsers(users);

  // Auto-login after registration
  const session = {
    token: generateToken(),
    user: sanitizeUser(user),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  saveSession(session);

  return { success: true, message: 'Account created successfully!', user: session.user };
}

/**
 * Log in with email and password.
 * @returns {{ success: boolean, message: string, user?: object }}
 */
export function login({ email, password, remember = false }) {
  if (!email || !password) {
    return { success: false, message: 'Email and password are required.' };
  }

  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user || user.password !== hashPassword(password)) {
    return { success: false, message: 'Invalid email or password.' };
  }

  const expiresAt = remember
    ? Date.now() + 30 * 24 * 60 * 60 * 1000  // 30 days
    : Date.now() + 24 * 60 * 60 * 1000;       // 1 day

  const session = {
    token: generateToken(),
    user: sanitizeUser(user),
    expiresAt,
  };
  saveSession(session);

  return { success: true, message: 'Welcome back!', user: session.user };
}

/**
 * Log out the current user.
 */
export function logout() {
  clearSession();
}

/**
 * Check if a user is currently authenticated.
 * @returns {boolean}
 */
export function isAuthenticated() {
  const session = getSession();
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    clearSession();
    return false;
  }
  return true;
}

/**
 * Get the current authenticated user.
 * @returns {object|null}
 */
export function getUser() {
  if (!isAuthenticated()) return null;
  return getSession()?.user || null;
}

/**
 * Update the current user's profile.
 * @returns {{ success: boolean, message: string }}
 */
export function updateProfile({ name, email }) {
  const session = getSession();
  if (!session) return { success: false, message: 'Not authenticated.' };

  const users = getUsers();
  const idx = users.findIndex(u => u.id === session.user.id);
  if (idx === -1) return { success: false, message: 'User not found.' };

  if (name) users[idx].name = name.trim();
  if (email) users[idx].email = email.toLowerCase().trim();

  saveUsers(users);

  // Update session
  session.user = sanitizeUser(users[idx]);
  saveSession(session);

  return { success: true, message: 'Profile updated successfully!' };
}

/**
 * Request a password reset (simulated — stores reset token in user record).
 * @returns {{ success: boolean, message: string, token?: string }}
 */
export function requestPasswordReset(email) {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    // Don't reveal whether email exists — always return success
    return { success: true, message: 'If this email is registered, a reset link has been sent.' };
  }

  const token = generateToken();
  user.resetToken = token;
  user.resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  saveUsers(users);

  // In a real app, email would be sent. We store token in sessionStorage for demo.
  sessionStorage.setItem('shalimar-reset-token', token);
  sessionStorage.setItem('shalimar-reset-email', email);

  return { success: true, message: 'If this email is registered, a reset link has been sent.', token };
}

/**
 * Complete password reset with token.
 * @returns {{ success: boolean, message: string }}
 */
export function resetPassword({ token, newPassword }) {
  if (!token || !newPassword) {
    return { success: false, message: 'Invalid reset request.' };
  }
  if (newPassword.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters.' };
  }

  const users = getUsers();
  const user = users.find(u =>
    u.resetToken === token && u.resetExpires && Date.now() < u.resetExpires
  );

  if (!user) {
    return { success: false, message: 'Reset token is invalid or has expired.' };
  }

  user.password = hashPassword(newPassword);
  delete user.resetToken;
  delete user.resetExpires;
  saveUsers(users);

  return { success: true, message: 'Password reset successfully! You can now log in.' };
}

/**
 * Redirect to login if not authenticated.
 * @param {string} [redirectTo] - URL to redirect to after login
 */
export function requireAuth(redirectTo = '/login.html') {
  if (!isAuthenticated()) {
    const current = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `${redirectTo}?redirect=${current}`;
    return false;
  }
  return true;
}

/**
 * Return a sanitized user object (no password).
 */
function sanitizeUser(user) {
  const { password, resetToken, resetExpires, ...safe } = user;
  return safe;
}

/**
 * Update the header UI based on auth state.
 * Call this on every page to show Login or User avatar.
 */
export function updateAuthHeader() {
  const user = getUser();
  const authSlots = document.querySelectorAll('[data-auth-slot]');

  authSlots.forEach(slot => {
    if (user) {
      // Show user avatar / initials
      const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      slot.innerHTML = `
        <a href="/dashboard.html" class="flex items-center gap-2 group" aria-label="My Account">
          <div class="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs font-manrope tracking-wider transition-all group-hover:bg-primary group-hover:text-on-primary">
            ${initials}
          </div>
        </a>
      `;
    } else {
      slot.innerHTML = `
        <a href="/login.html" class="flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 text-primary font-manrope font-bold text-xs tracking-widest uppercase hover:bg-primary hover:text-on-primary transition-all">
          <span class="material-symbols-outlined" style="font-size:1rem;">person</span>
          <span class="hidden sm:inline">Login</span>
        </a>
      `;
    }
  });
}
