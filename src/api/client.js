const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/admin/users${q ? `?${q}` : ''}`)
  },
  createSystemUser: (body) =>
    request('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateSystemUser: (id, body) =>
    request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSystemUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  updateUserStatus: (id, status) =>
    request(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/admin/payments${q ? `?${q}` : ''}`)
  },
}
