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
  dashboard: () => request('/dashboard'),
  getQuotes: () => request('/quotes'),
  createQuote: (body) => request('/quotes', { method: 'POST', body: JSON.stringify(body) }),
  updateQuote: (id, body) => request(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuote: (id) => request(`/quotes/${id}`, { method: 'DELETE' }),
  getLeads: () => request('/leads'),
  updateLead: (id, body) => request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLead: (id) => request(`/leads/${id}`, { method: 'DELETE' }),
}
