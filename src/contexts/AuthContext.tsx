'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthService, AuthUser } from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar usuário do localStorage ao montar o componente
  useEffect(() => {
    const storedUser = AuthService.getUser()
    setUser(storedUser)
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await AuthService.login(email, password)
    
    if (response.success && response.data) {
      setUser(response.data.usuario)
    } else {
      throw new Error(response.error?.message || 'Erro ao fazer login')
    }
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  
  return context
}
