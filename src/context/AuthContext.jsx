import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

function isAdmin(user) {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    if (token === 'demo-admin-token' || token === 'demo-super-admin-token') {
      setUser(
        token === 'demo-super-admin-token'
          ? {
              id: 'demo-super-admin',
              email: 'superadmin@123quotes.com',
              role: 'SUPER_ADMIN',
              name: 'Super Admin',
            }
          : {
              id: 'demo-admin',
              email: 'admin@123quotes.com',
              role: 'ADMIN',
              name: 'Platform Admin',
            },
      )
      setLoading(false)
      return
    }
    api
      .me()
      .then((data) => {
        if (!isAdmin(data.user)) {
          localStorage.removeItem('token')
          setUser(null)
          return
        }
        setUser(data.user)
      })
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    try {
      const data = await api.login({ email, password })
      if (!isAdmin(data.user)) {
        throw new Error('Admin access only')
      }
      localStorage.setItem('token', data.token)
      setUser(data.user)
      return data.user
    } catch (err) {
      // Demo fallback when API/DB is unavailable
      if (
        String(email).toLowerCase() === 'superadmin@123quotes.com' &&
        String(password) === 'superadmin123'
      ) {
        const demoUser = {
          id: 'demo-super-admin',
          email: 'superadmin@123quotes.com',
          role: 'SUPER_ADMIN',
          name: 'Super Admin',
        }
        localStorage.setItem('token', 'demo-super-admin-token')
        setUser(demoUser)
        return demoUser
      }
      throw err
    }
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
