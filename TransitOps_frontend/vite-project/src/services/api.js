/**
 * TransitOps API Service Layer
 * Centralized HTTP client with JWT token management.
 * All backend endpoints are proxied through Vite dev server (/api → localhost:8080/api).
 */

const API_BASE = '/api';

// ──────────────────────────── Token helpers ────────────────────────────
export function getToken() {
  return localStorage.getItem('transitops_token');
}

export function setToken(token) {
  localStorage.setItem('transitops_token', token);
}

export function clearToken() {
  localStorage.removeItem('transitops_token');
  localStorage.removeItem('transitops_user');
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('transitops_user'));
  } catch {
    return null;
  }
}

export function setUser(user) {
  localStorage.setItem('transitops_user', JSON.stringify(user));
}

// ──────────────────────────── Generic fetch wrapper ────────────────────
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  // Handle 204 No Content (e.g. DELETE responses)
  if (res.status === 204) return null;

  // Handle CSV/blob downloads
  if (options.responseType === 'blob') {
    if (!res.ok) throw await parseError(res);
    return res.blob();
  }

  // Parse JSON body
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.message || data?.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.fieldErrors = data?.fieldErrors || null;
    error.data = data;
    throw error;
  }

  return data;
}

async function parseError(res) {
  const data = await res.json().catch(() => ({}));
  const error = new Error(data?.message || data?.error || `Request failed (${res.status})`);
  error.status = res.status;
  error.fieldErrors = data?.fieldErrors || null;
  return error;
}

// ──────────────────────────── Auth API ─────────────────────────────────
export const authApi = {
  login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register(name, email, password, roleName) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, roleName })
    });
  }
};

// ──────────────────────────── Vehicles API ─────────────────────────────
export const vehiclesApi = {
  getAll(status) {
    const params = status ? `?status=${status}` : '';
    return request(`/vehicles${params}`);
  },

  getById(id) {
    return request(`/vehicles/${id}`);
  },

  create(vehicleData) {
    return request('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData)
    });
  },

  update(id, vehicleData) {
    return request(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData)
    });
  },

  delete(id) {
    return request(`/vehicles/${id}`, { method: 'DELETE' });
  }
};

// ──────────────────────────── Drivers API ──────────────────────────────
export const driversApi = {
  getAll(status) {
    const params = status ? `?status=${status}` : '';
    return request(`/drivers${params}`);
  },

  getById(id) {
    return request(`/drivers/${id}`);
  },

  create(driverData) {
    return request('/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData)
    });
  },

  update(id, driverData) {
    return request(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driverData)
    });
  },

  delete(id) {
    return request(`/drivers/${id}`, { method: 'DELETE' });
  }
};

// ──────────────────────────── Trips API ────────────────────────────────
export const tripsApi = {
  getAll() {
    return request('/trips');
  },

  create(tripData) {
    return request('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData)
    });
  },

  dispatch(id) {
    return request(`/trips/${id}/dispatch`, { method: 'POST' });
  },

  complete(id, actualDistance) {
    return request(`/trips/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ actualDistance })
    });
  },

  cancel(id) {
    return request(`/trips/${id}/cancel`, { method: 'POST' });
  }
};

// ──────────────────────────── Maintenance API ─────────────────────────
export const maintenanceApi = {
  getAll() {
    return request('/maintenance');
  },

  create(maintenanceData) {
    return request('/maintenance', {
      method: 'POST',
      body: JSON.stringify(maintenanceData)
    });
  },

  close(id) {
    return request(`/maintenance/${id}/close`, { method: 'POST' });
  }
};

// ──────────────────────────── Fuel & Expense API ──────────────────────
export const fuelApi = {
  getAll(vehicleId) {
    const params = vehicleId ? `?vehicleId=${vehicleId}` : '';
    return request(`/fuel-logs${params}`);
  },

  create(fuelData) {
    return request('/fuel-logs', {
      method: 'POST',
      body: JSON.stringify(fuelData)
    });
  }
};

export const expensesApi = {
  getAll(vehicleId, type) {
    const params = new URLSearchParams();
    if (vehicleId) params.set('vehicleId', vehicleId);
    if (type) params.set('type', type);
    const qs = params.toString();
    return request(`/expenses${qs ? `?${qs}` : ''}`);
  },

  create(expenseData) {
    return request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData)
    });
  }
};

// ──────────────────────────── Dashboard KPIs API ─────────────────────
export const dashboardApi = {
  getKpis() {
    return request('/dashboard/kpis');
  }
};

// ──────────────────────────── Reports API ─────────────────────────────
export const reportsApi = {
  getFuelEfficiency() {
    return request('/reports/fuel-efficiency');
  },

  getOperationalCost() {
    return request('/reports/operational-cost');
  },

  getRoi() {
    return request('/reports/roi');
  },

  async downloadCsv() {
    const token = getToken();
    const res = await fetch(`${API_BASE}/reports/export/csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) {
      throw new Error('CSV export failed');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TransitOps_Fleet_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
