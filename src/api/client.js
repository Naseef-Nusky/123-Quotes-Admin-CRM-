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

  getDashboard: () => request('/admin/dashboard'),

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

  updateProfessional: (id, body) =>
    request(`/admin/professionals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProfessional: (id) => request(`/admin/professionals/${id}`, { method: 'DELETE' }),
  createProfessional: (body) =>
    request('/admin/professionals', { method: 'POST', body: JSON.stringify(body) }),

  createCustomer: (body) =>
    request('/admin/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (id, body) =>
    request(`/admin/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCustomer: (id) => request(`/admin/customers/${id}`, { method: 'DELETE' }),

  getLeads: () => request('/leads/admin/all'),
  updateLead: (id, body) =>
    request(`/leads/admin/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLead: (id) => request(`/leads/admin/${id}`, { method: 'DELETE' }),

  getPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/admin/payments${q ? `?${q}` : ''}`)
  },

  getSettings: () => request('/admin/settings'),
  upsertSetting: (body) => request('/admin/settings', { method: 'POST', body: JSON.stringify(body) }),

  getServices: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/services${q ? `?${q}` : ''}`)
  },
  getCategories: () => request('/services/categories'),
  manageServices: () => request('/services/manage/all'),
  createService: (body) =>
    request('/services/manage', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id, body) =>
    request(`/services/manage/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteService: (id) => request(`/services/manage/${id}`, { method: 'DELETE' }),
  createCategory: (body) =>
    request('/services/manage/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) =>
    request(`/services/manage/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id) =>
    request(`/services/manage/categories/${id}`, { method: 'DELETE' }),

  getQuestions: (serviceId) =>
    request(`/questions${serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : ''}`),
  createQuestion: (body) =>
    request('/questions', { method: 'POST', body: JSON.stringify(body) }),
  updateQuestion: (id, body) =>
    request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: 'DELETE' }),
}
