import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'

// Configuração base do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Serviços específicos
export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  register: (name: string, username: string, password: string) =>
    api.post('/auth/register', { name, username, password }),
  
  getProfile: () => api.get('/auth/me'),
}

export const accountsService = {
  getAll: () => api.get('/accounts'),
  getById: (id: string) => api.get(`/accounts/${id}`),
  create: (data: any) => api.post('/accounts', data),
  update: (id: string, data: any) => api.put(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
}

export const creditCardsService = {
  getAll: () => api.get('/credit-cards'),
  getById: (id: string) => api.get(`/credit-cards/${id}`),
  create: (data: any) => api.post('/credit-cards', data),
  update: (id: string, data: any) => api.put(`/credit-cards/${id}`, data),
  delete: (id: string) => api.delete(`/credit-cards/${id}`),
}

export const transactionsService = {
  getAll: (params?: any) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: any) => api.post('/transactions', data),
  update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  getDashboardSummary: () => api.get('/transactions/summary/dashboard'),
  getMonthlyExpenses: (params?: any) => api.get('/transactions/summary/monthly-expenses', { params }),
  getExpensesHistory: (params?: any) => api.get('/transactions/summary/expenses-history', { params }),
  getCategoriesBreakdown: (params?: any) => api.get('/transactions/summary/categories', { params }),
}

export const aiService = {
  suggestCategory: (description: string, amount: number) =>
    api.post('/ai/suggest-category', { description, amount }),
}