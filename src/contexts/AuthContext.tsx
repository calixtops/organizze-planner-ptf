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
      // Tentar buscar usuário via API primeiro
      try {
        const response = await api.get('/auth/me')
        setUser(response.data)
        setLoading(false)
      } catch (apiError) {
        // Se a API falhar, usar usuário mock do localStorage
        console.log('API não disponível, usando usuário mock')
        
        const token = localStorage.getItem('token')
        if (token && token.startsWith('mock-jwt-token-')) {
                const mockUser = {
                  _id: 'mock-user-id',
                  name: 'Usuário Demo',
                  username: 'demo',
                  email: 'demo@demo.com',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
          setUser(mockUser)
        } else {
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      setLoading(true)
      
      // Tentar login via API primeiro
      try {
        const response = await api.post('/auth/login', { username, password })
        const { token, user } = response.data
        
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(user)
        setLoading(false)
      } catch (apiError) {
        // Se a API falhar, usar login mock via servidor local
        console.log('API principal não disponível, tentando servidor mock local')
        
        try {
          // Tentar conectar com o servidor mock local
          const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
          })
          
          if (response.ok) {
            const { token, user } = await response.json()
            localStorage.setItem('token', token)
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            setUser(user)
            setLoading(false)
          } else {
            throw new Error('Servidor mock não disponível')
          }
        } catch (mockError) {
          console.log('Servidor mock não disponível, usando login local')
          
                  // Fallback para login local
                  const mockUser = {
                    _id: 'mock-user-id',
                    name: 'Usuário Demo',
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
      }
    } catch (error: any) {
      setLoading(false)
      throw new Error('Erro ao fazer login')
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
