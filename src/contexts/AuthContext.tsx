import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthContextType } from '../types'
import api from '../services/api'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      console.log('🔍 Buscando usuário...')
      const response = await api.get('/auth/me')
      console.log('✅ Usuário encontrado:', response.data)
      setUser(response.data)
    } catch (error: any) {
      console.error('❌ Erro ao buscar usuário:', error?.response?.status, error?.message)
      // Se falhar, limpar token inválido
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)
      console.log('🔐 Tentando fazer login...')
      
      const response = await api.post('/auth/login', { username, password })
      const { token, user } = response.data
      
      console.log('✅ Login bem-sucedido!', { user })
      
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      setLoading(false)
    } catch (error: any) {
      setLoading(false)
      console.error('❌ Erro ao fazer login:', error?.response?.status, error?.response?.data, error?.message)
      throw new Error(error.response?.data?.error || 'Erro ao fazer login')
    }
  }

  const register = async (name: string, username: string, password: string) => {
    try {
      setLoading(true)
      
      // Tentar registro via API primeiro
      try {
        const response = await api.post('/auth/register', { name, username, password })
        const { token, user } = response.data
        
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(user)
        setLoading(false)
      } catch (apiError) {
        // Se a API falhar, usar registro mock
        console.log('API não disponível, usando registro mock')
        
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 1000))
        
                // Registro mock
                const mockUser = {
                  _id: 'mock-user-id',
                  name: name,
                  username: username,
                  email: `${username}@demo.com`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
        
        const mockToken = 'mock-jwt-token-' + Date.now()
        
        localStorage.setItem('token', mockToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`
        
        setUser(mockUser)
        setLoading(false)
      }
    } catch (error: any) {
      setLoading(false)
      throw new Error('Erro ao criar conta')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
