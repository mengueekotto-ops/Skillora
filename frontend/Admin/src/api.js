const BASE = '/api/admin';

const getToken = () => localStorage.getItem('skillora_admin_token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const api = {
  // AUTH
  login: (email, password) =>
    fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(r => r.json()),
  getMe: () => fetch(`${BASE}/auth/me`, { headers: headers() }).then(r => r.json()),

  // STATS
  getStats: () => fetch(`${BASE}/stats`, { headers: headers() }).then(r => r.json()),

  // SEARCH
  search: (q) => fetch(`${BASE}/search?q=${encodeURIComponent(q)}`, { headers: headers() }).then(r => r.json()),

  // USERS
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/users${qs ? '?' + qs : ''}`, { headers: headers() }).then(r => r.json());
  },
  getUserById: (id) => fetch(`${BASE}/users/${id}`, { headers: headers() }).then(r => r.json()),
  toggleUserStatus: (id) =>
    fetch(`${BASE}/users/${id}/status`, { method: 'PUT', headers: headers() }).then(r => r.json()),
  deleteUser: (id) =>
    fetch(`${BASE}/users/${id}`, { method: 'DELETE', headers: headers() }).then(r => r.json()),

  // PROFESSIONALS
  getProfessionals: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/professionals${qs ? '?' + qs : ''}`, { headers: headers() }).then(r => r.json());
  },

  // VERIFICATIONS
  getVerifications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/verification-requests${qs ? '?' + qs : ''}`, { headers: headers() }).then(r => r.json());
  },
  processVerification: (id, action, targetStatus, reason) =>
    fetch(`${BASE}/verification/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify({ action, targetStatus, reason }) }).then(r => r.json()),

  // SERVICES
  getServices: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/services${qs ? '?' + qs : ''}`, { headers: headers() }).then(r => r.json());
  },
  toggleServiceStatus: (id) =>
    fetch(`${BASE}/services/${id}/status`, { method: 'PUT', headers: headers() }).then(r => r.json()),
  deleteService: (id) =>
    fetch(`${BASE}/services/${id}`, { method: 'DELETE', headers: headers() }).then(r => r.json()),

  // REQUESTS
  getRequests: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/requests${qs ? '?' + qs : ''}`, { headers: headers() }).then(r => r.json());
  },

  // REVIEWS
  getReviews: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE}/reviews${qs ? '?' + qs : ''}`, { headers: headers() }).then(r => r.json());
  },
  deleteReview: (id) =>
    fetch(`${BASE}/reviews/${id}`, { method: 'DELETE', headers: headers() }).then(r => r.json()),

  // CATEGORIES
  getCategories: () => fetch(`${BASE}/categories`, { headers: headers() }).then(r => r.json()),
  createCategory: (data) =>
    fetch(`${BASE}/categories`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
  updateCategory: (id, data) =>
    fetch(`${BASE}/categories/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
  deleteCategory: (id) =>
    fetch(`${BASE}/categories/${id}`, { method: 'DELETE', headers: headers() }).then(r => r.json()),

  // NOTIFICATIONS
  sendNotification: (data) =>
    fetch(`${BASE}/notifications/send`, { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(r => r.json()),
};

export default api;
