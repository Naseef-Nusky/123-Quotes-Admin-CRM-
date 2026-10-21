const API_BASE = import.meta.env.VITE_API_URL || '/api'

/** Deduplicate concurrent identical GETs (React StrictMode remounts, parallel pages). */
const inflightGets = new Map()

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase()
  const isGet = method === 'GET'
  if (isGet && inflightGets.has(path)) {
    return inflightGets.get(path)
  }

  const run = (async () => {
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
  })()

  if (isGet) {
    inflightGets.set(path, run)
    run.finally(() => {
      if (inflightGets.get(path) === run) inflightGets.delete(path)
    })
  }

  return run
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  getDashboard: () => request('/admin/dashboard'),

  getBusinessApplications: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/admin/business-applications${q ? `?${q}` : ''}`)
  },
  approveBusinessApplication: (id) =>
    request(`/admin/business-applications/${id}/approve`, { method: 'POST' }),
  declineBusinessApplication: (id, body = {}) =>
    request(`/admin/business-applications/${id}/decline`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getNotifications: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/admin/notifications${q ? `?${q}` : ''}`)
  },
  markNotificationRead: (id) =>
    request(`/admin/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request('/admin/notifications/read-all', { method: 'PATCH' }),

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
  deleteAllCustomers: () => request('/admin/customers/all', { method: 'DELETE' }),
  deleteAllProfessionals: () => request('/admin/professionals/all', { method: 'DELETE' }),
  deleteAllLeads: () => request('/admin/leads/all', { method: 'DELETE' }),
  deleteAllPayments: () => request('/admin/payments/all', { method: 'DELETE' }),
  deleteAllBusinessApplications: () =>
    request('/admin/business-applications/all', { method: 'DELETE' }),
  deleteAllPackages: () => request('/admin/packages/all', { method: 'DELETE' }),
  deleteAllCategories: () => request('/admin/categories/all', { method: 'DELETE' }),
  deleteAllPostcodes: () => request('/admin/postcodes/all', { method: 'DELETE' }),
  deleteAllSystemUsers: () => request('/admin/users/all', { method: 'DELETE' }),

  getLeads: () => request('/leads/admin/all'),
  downloadRequestAttachment: async (requestId, attachmentId, filename) => {
    const token = getToken()
    const res = await fetch(
      `${API_BASE}/requests/${requestId}/attachments/${attachmentId}/download`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    )
    if (!res.ok) {
      let message = 'Download failed'
      try {
        const data = await res.json()
        message = data.message || message
      } catch {
        /* keep default */
      }
      throw new Error(message)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'attachment'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  },
  updateLead: (id, body) =>
    request(`/leads/admin/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLead: (id) => request(`/leads/admin/${id}`, { method: 'DELETE' }),

  getPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/admin/payments${q ? `?${q}` : ''}`)
  },

  getPackages: () => request('/admin/packages'),
  createPackage: (body) =>
    request('/admin/packages', { method: 'POST', body: JSON.stringify(body) }),
  updatePackage: (id, body) =>
    request(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  getSettings: () => request('/admin/settings'),
  upsertSetting: (body) => request('/admin/settings', { method: 'POST', body: JSON.stringify(body) }),

  getServices: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/services${q ? `?${q}` : ''}`)
  },
  getCategories: () => request('/services/categories'),
  manageServices: () => request('/services/manage/all'),
  manageCategories: () => request('/services/manage/categories'),
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

  listPostcodes: () => request('/postcodes/list'),
  suggestPostcodes: (q, limit = 40) =>
    request(`/postcodes/suggest?q=${encodeURIComponent(q)}&limit=${limit}`),
  managePostcodes: (params = {}) => {
    const qs = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue
      qs.set(key, String(value))
    }
    const q = qs.toString()
    return request(`/postcodes/manage${q ? `?${q}` : ''}`)
  },
  createPostcode: (body) =>
    request('/postcodes/manage', { method: 'POST', body: JSON.stringify(body) }),
  updatePostcode: (id, body) =>
    request(`/postcodes/manage/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePostcode: (id) => request(`/postcodes/manage/${id}`, { method: 'DELETE' }),
}
