'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { api } from './api'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refreshTokens: (() => Promise<void>) | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_TOKEN_EXPIRY_MS = 14 * 60 * 1000
const REFRESH_BEFORE_MS = 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const saveAuthData = (userData: User, accessToken: string, refreshToken: string) => {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${60*60*24*7}; SameSite=Lax`
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${60*60*24*7}; SameSite=Lax`
  }

  const clearAuthData = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    document.cookie = 'accessToken=; path=/; max-age=0'
    document.cookie = 'refreshToken=; path=/; max-age=0'
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
  }

  const scheduleTokenRefresh = (refreshToken: string) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    const timeUntilRefresh = ACCESS_TOKEN_EXPIRY_MS - REFRESH_BEFORE_MS

    refreshTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.refresh(refreshToken) as any
        
        if (response.success) {
          const newAccessToken = response.accessToken
          const newRefreshToken = response.refreshToken
          
          setToken(newAccessToken)
          localStorage.setItem('accessToken', newAccessToken)
          localStorage.setItem('refreshToken', newRefreshToken)
          
          document.cookie = `accessToken=${newAccessToken}; path=/; max-age=${60*60*24*7}; SameSite=Lax`
          document.cookie = `refreshToken=${newRefreshToken}; path=/; max-age=${60*60*24*7}; SameSite=Lax`
          
          scheduleTokenRefresh(newRefreshToken)
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        clearAuthData()
        window.location.href = '/login'
      }
    }, timeUntilRefresh)
  }

  useEffect(() => {
    const savedAccessToken = localStorage.getItem('accessToken')
    const savedRefreshToken = localStorage.getItem('refreshToken')
    const savedUser = localStorage.getItem('user')
    
    if (savedAccessToken && savedRefreshToken && savedUser) {
      try {
        setToken(savedAccessToken)
        setUser(JSON.parse(savedUser))
        scheduleTokenRefresh(savedRefreshToken)
      } catch (e) {
        clearAuthData()
      }
    }
    setIsLoading(false)

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password) as any

    if (!response.success) {
      throw new Error(response.error || 'Login failed')
    }
    
    const userData = response.user
    const accessToken = response.accessToken
    const refreshToken = response.refreshToken

    saveAuthData(userData, accessToken, refreshToken)
    scheduleTokenRefresh(refreshToken)
  }

  const signup = async (email: string, password: string, name: string) => {
    const response = await api.signup(email, password, name) as any

    if (!response.success) {
      throw new Error(response.error || 'Signup failed')
    }
    
    const userData = response.user
    const accessToken = response.accessToken
    const refreshToken = response.refreshToken

    saveAuthData(userData, accessToken, refreshToken)
    scheduleTokenRefresh(refreshToken)
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    const userId = user?.id

    try {
      if (refreshToken && userId) {
        await api.logout(userId, refreshToken)
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    }

    clearAuthData()
  }

  const refreshTokens = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    
    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    const response = await api.refresh(refreshToken) as any
    
    if (response.success) {
      const newAccessToken = response.accessToken
      const newRefreshToken = response.refreshToken
      
      setToken(newAccessToken)
      localStorage.setItem('accessToken', newAccessToken)
      localStorage.setItem('refreshToken', newRefreshToken)
      
      document.cookie = `accessToken=${newAccessToken}; path=/; max-age=${60*60*24*7}; SameSite=Lax`
      document.cookie = `refreshToken=${newRefreshToken}; path=/; max-age=${60*60*24*7}; SameSite=Lax`
      
      scheduleTokenRefresh(newRefreshToken)
    } else {
      throw new Error(response.error || 'Refresh failed')
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, refreshTokens }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
