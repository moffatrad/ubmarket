// ============================================
// UBMarket - Main Application JavaScript
// ============================================

// Configuration
const API_URL = 'http://localhost:5000/api';
const BASE_URL = window.location.origin;

// State management
const AppState = {
  user: null,
  token: localStorage.getItem('ubmarket_token'),
  isAuthenticated: false
};

// ============================================
// API Client
// ============================================
const api = {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (AppState.token) {
      headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    const config = {
      ...options,
      headers
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  // Form data upload (for images)
  async upload(endpoint, formData) {
    const url = `${API_URL}${endpoint}`;
    const headers = {};

    if (AppState.token) {
      headers['Authorization'] = `Bearer ${AppState.token}`;
    }

    const config = {
      method: 'POST',
      headers,
      body: formData
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }
};

// ============================================
// Auth Functions
// ============================================
const Auth = {
  setToken(token) {
    AppState.token = token;
    localStorage.setItem('ubmarket_token', token);
  },

  clearToken() {
    AppState.token = null;
    localStorage.removeItem('ubmarket_token');
  },

  setUser(user) {
    AppState.user = user;
    AppState.isAuthenticated = true;
    localStorage.setItem('ubmarket_user', JSON.stringify(user));
  },

  clearUser() {
    AppState.user = null;
    AppState.isAuthenticated = false;
    localStorage.removeItem('ubmarket_user');
  },

  loadUser() {
    const userData = localStorage.getItem('ubmarket_user');
    if (userData) {
      try {
        AppState.user = JSON.parse(userData);
        AppState.isAuthenticated = true;
        return AppState.user;
      } catch (e) {
        this.clearUser();
      }
    }
    return null;
  },

  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async register(name, email, password, studentId) {
    const data = await api.post('/auth/register', { name, email, password, studentId });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  logout() {
    this.clearToken();
    this.clearUser();
    window.location.href = '/';
  },

  async getCurrentUser() {
    try {
      const data = await api.get('/auth/me');
      this.setUser(data);
      return data;
    } catch (error) {
      this.clearToken();
      this.clearUser();
      throw error;
    }
  },

  async updateProfile(data) {
    return await api.put('/auth/profile', data);
  }
};

// ============================================
// DOM Helpers
// ============================================
const DOM = {
  $(selector, context = document) {
    return context.querySelector(selector);
  },

  $$(selector, context = document) {
    return [...context.querySelectorAll(selector)];
  },

  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'textContent') {
        el.textContent = value;
      } else if (key === 'innerHTML') {
        el.innerHTML = value;
      } else {
        el.setAttribute(key, value);
      }
    });
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    });
    return el;
  },

  show(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) element.style.display = '';
  },

  hide(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) element.style.display = 'none';
  },

  toggle(element) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) {
      element.style.display = element.style.display === 'none' ? '' : 'none';
    }
  },

  addClass(element, className) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) element.classList.add(className);
  },

  removeClass(element, className) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) element.classList.remove(className);
  },

  hasClass(element, className) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    return element ? element.classList.contains(className) : false;
  },

  html(element, content) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) element.innerHTML = content;
  },

  text(element, content) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) element.textContent = content;
  },

  value(element, val) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) {
      if (val !== undefined) {
        element.value = val;
      }
      return element.value;
    }
    return null;
  },

  on(element, event, handler) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) {
      element.addEventListener(event, handler);
    }
  },

  delegate(element, event, selector, handler) {
    if (typeof element === 'string') {
      element = this.$(element);
    }
    if (element) {
      element.addEventListener(event, (e) => {
        const target = e.target.closest(selector);
        if (target) {
          handler(e, target);
        }
      });
    }
  },

  // Show toast notification
  toast(message, type = 'info') {
    const toastContainer = this.$('#toastContainer') || (() => {
      const container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 360px;
        width: 100%;
      `;
      document.body.appendChild(container);
      return container;
    })();

    const colors = {
      success: '#38a169',
      error: '#e53e3e',
      warning: '#d69e2e',
      info: '#3182ce'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 14px 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-left: 4px solid ${colors[type] || colors.info};
      display: flex;
      justify-content: space-between;
      align-items: center;
      animation: slideIn 0.3s ease;
      font-size: 14px;
      color: #2d3748;
    `;
    toast.innerHTML = `
      <span>${message}</span>
      <button style="background:none;border:none;font-size:20px;cursor:pointer;color:#a0aec0;padding:0 4px;">×</button>
    `;

    toast.querySelector('button').addEventListener('click', () => {
      toast.remove();
    });

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
};

// ============================================
// Header & Navigation
// ============================================
function initHeader() {
  const user = Auth.loadUser();
  const authButtons = DOM.$('#authButtons');
  const userMenu = DOM.$('#userMenu');
  const userName = DOM.$('#userName');
  const userAvatar = DOM.$('#userAvatar');

  if (user) {
    DOM.hide(authButtons);
    DOM.show(userMenu);
    if (userName) DOM.text(userName, user.name || 'User');
    if (userAvatar && user.avatar_url) {
      userAvatar.src = user.avatar_url;
    }
  } else {
    DOM.show(authButtons);
    DOM.hide(userMenu);
  }

  // User dropdown toggle
  const avatarBtn = DOM.$('#userAvatarBtn');
  const dropdown = DOM.$('#userDropdown');

  if (avatarBtn) {
    DOM.on(avatarBtn, 'click', (e) => {
      e.stopPropagation();
      DOM.toggle(dropdown);
    });
  }

  // Close dropdown on outside click
  document.addEventListener('click', () => {
    if (dropdown) DOM.hide(dropdown);
  });

  // Logout
  const logoutBtn = DOM.$('#logoutBtn');
  if (logoutBtn) {
    DOM.on(logoutBtn, 'click', (e) => {
      e.preventDefault();
      Auth.logout();
    });
  }
}

// ============================================
// Toast Styles
// ============================================
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initHeader();

  // Check authentication status
  if (AppState.token) {
    Auth.getCurrentUser().catch(() => {
      // Token expired or invalid
      Auth.clearToken();
      Auth.clearUser();
      initHeader();
    });
  }
});

// Make functions globally available
window.DOM = DOM;
window.api = api;
window.Auth = Auth;
window.AppState = AppState;