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

  dashboard: () => request('/admin/dashboard'),

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

  getCategories: () => request('/services/categories'),
  getServicesAll: () => request('/services/manage/all'),
  upsertCategory: (body) =>
    request('/services/manage/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) =>
    request(`/services/manage/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  upsertService: (body) =>
    request('/services/manage', { method: 'POST', body: JSON.stringify(body) }),
  updateService: (id, body) =>
    request(`/services/manage/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  getQuestions: (serviceId) =>
    request(`/questions${serviceId ? `?serviceId=${serviceId}` : ''}`),
  createQuestion: (body) =>
    request('/questions', { method: 'POST', body: JSON.stringify(body) }),
  updateQuestion: (id, body) =>
    request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: 'DELETE' }),
  createBranch: (body) =>
    request('/questions/branches', { method: 'POST', body: JSON.stringify(body) }),

  getRequests: (status) =>
    request(`/requests/admin/all${status ? `?status=${status}` : ''}`),
  updateRequestStatus: (id, status) =>
    request(`/requests/admin/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  getLeads: () => request('/leads/admin/all'),
  rematchLead: (id) => request(`/leads/admin/${id}/rematch`, { method: 'POST' }),

  getPackages: () => request('/admin/packages'),
  createPackage: (body) =>
    request('/admin/packages', { method: 'POST', body: JSON.stringify(body) }),
  updatePackage: (id, body) =>
    request(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  getPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/admin/payments${q ? `?${q}` : ''}`)
  },

  getTemplates: () => request('/admin/templates'),
  upsertTemplate: (body) =>
    request('/admin/templates', { method: 'POST', body: JSON.stringify(body) }),

  getSettings: () => request('/admin/settings'),
  upsertSetting: (body) =>
    request('/admin/settings', { method: 'POST', body: JSON.stringify(body) }),

  getPages: () => request('/admin/pages'),
  upsertPage: (body) =>
    request('/admin/pages', { method: 'POST', body: JSON.stringify(body) }),

  getActivity: () => request('/admin/activity'),

  adjustTokens: (body) =>
    request('/professionals/admin/tokens/adjust', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
