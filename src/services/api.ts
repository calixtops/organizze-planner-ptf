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
      console.warn('⚠️ Erro 401: Token inválido ou expirado')
      // Token expirado ou inválido
      const currentPath = window.location.pathname
      
      // Só redirecionar se não estivermos já na página de login
      if (currentPath !== '/login' && currentPath !== '/register') {
        console.log('🔄 Redirecionando para login...')
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        
        // Usar setTimeout para evitar loop de redirecionamento
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      }
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

export const groupsService = {
  getAll: () => api.get('/groups'),
  create: (data: any) => api.post('/groups', data),
  getMembers: (groupId: string) => api.get(`/groups/${groupId}/members`),
  addMember: (groupId: string, data: any) => api.post(`/groups/${groupId}/members`, data),
}

export const installmentsService = {
  getAll: (params?: any) => api.get('/installments', { params }),
  getById: (id: string) => api.get(`/installments/${id}`),
  create: (data: any) => api.post('/installments', data),
  update: (id: string, data: any) => api.put(`/installments/${id}`, data),
  delete: (id: string) => api.delete(`/installments/${id}`),
  pay: (id: string, paymentDate?: string) => api.put(`/installments/${id}/pay`, { paymentDate }),
  markPaid: (id: string, paidCount: number) => api.put(`/installments/${id}/mark-paid`, { paidCount }),
  cancel: (id: string) => api.put(`/installments/${id}/cancel`),
}

export const familyMembersService = {
  getAll: () => api.get('/family-members'),
  create: (data: any) => api.post('/family-members', data),
  update: (id: string, data: any) => api.put(`/family-members/${id}`, data),
  delete: (id: string) => api.delete(`/family-members/${id}`),
}

export const recurringExpensesService = {
  getAll: (params?: any) => api.get('/recurring-expenses', { params }),
  create: (data: any) => api.post('/recurring-expenses', data),
  update: (id: string, data: any) => api.put(`/recurring-expenses/${id}`, data),
  delete: (id: string) => api.delete(`/recurring-expenses/${id}`),
  generate: (id: string, month?: number, year?: number) => 
    api.post(`/recurring-expenses/${id}/generate`, { month, year }),
  generateAll: (month?: number, year?: number) => 
    api.post('/recurring-expenses/generate-all', { month, year }),
}

export const aiService = {
  suggestCategory: (description: string, amount: number, type?: 'income' | 'expense') =>
    api.post('/ai/suggest-category', { description, amount, type }),
  chat: (message: string, userContext?: any) =>
    api.post('/ai/chat', { message, userContext }),
}