const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Restaurants
  getRestaurants: () => request('/restaurants'),
  getRestaurant: (slug) => request(`/restaurants/${slug}`),

  // Menu
  getMenu: (restaurantId) => request(`/restaurants/${restaurantId}/menu`),

  // Admin
  getCategories: (restaurantId) => request(`/admin/categories/${restaurantId}`),
  createCategory: (data) => request('/admin/categories', { method: 'POST', body: data }),
  createMenuItem: (data) => request('/admin/menu-items', { method: 'POST', body: data }),
  updateMenuItem: (id, data) => request(`/admin/menu-items/${id}`, { method: 'PUT', body: data }),
  deleteMenuItem: (id) => request(`/admin/menu-items/${id}`, { method: 'DELETE' }),

  // Tables
  getTables: (restaurantId) => request(`/restaurants/${restaurantId}/tables`),
  getTableQR: (tableId) => request(`/tables/${tableId}/qr`),

  // Sessions
  createSession: (data) => request('/sessions', { method: 'POST', body: data }),
  getSession: (id) => request(`/sessions/${id}`),
  joinByCode: (data) => request('/sessions/join', { method: 'POST', body: data }),
  closeSession: (id) => request(`/sessions/${id}/close`, { method: 'POST' }),
  getPaidOrders: (sessionId) => request(`/sessions/${sessionId}/paid-orders`),

  // Orders
  createOrders: (data) => request('/orders', { method: 'POST', body: data }),

  // Payments
  createPayment: (data) => request('/payments', { method: 'POST', body: data }),
};
