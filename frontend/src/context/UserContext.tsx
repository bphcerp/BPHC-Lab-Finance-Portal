import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Role = 'Admin' | 'Viewer'

export type CurrentUser = {
  name?: string
  email: string
  role: Role
}

type UserContextValue = {
  user: CurrentUser | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  hasRole: (...roles: Role[]) => boolean
  refresh: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

async function fetchMe(): Promise<CurrentUser | null> {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/me`, {
      credentials: 'include',
      headers: { 'From-Page': 'login' }, 
    })
    if (res.status !== 200) return null
    return await res.json()
  } catch (e) {
    console.error('failed to fetch /user/me', e)
    return null
  }
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const me = await fetchMe()
    setUser(me)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const value = useMemo<UserContextValue>(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    hasRole: (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    refresh: load,
  }), [user, loading])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within a UserProvider')
  return ctx
}

export const RoleGate: React.FC<{ anyOf: Role[]; children: React.ReactNode }>= ({ anyOf, children }) => {
  const { hasRole } = useUser()
  if (!hasRole(...anyOf)) return null
  return <>{children}</>
}
