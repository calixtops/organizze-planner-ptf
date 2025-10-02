export interface User {
  _id: string
  username: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Account {
  _id: string
  name: string
  type: 'checking' | 'savings' | 'investment' | 'credit'
  balance: number
  bank?: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface CreditCard {
  _id: string
  name: string
  bank: string
  limit: number
  currentBalance: number
  closingDay: number
  dueDay: number
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  _id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  status: 'paid' | 'pending'
  date: string
  accountId?: string
  creditCardId?: string
  userId: string
  aiCategory?: string
  aiExplanation?: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  name: string
  type: 'income' | 'expense'
  color: string
}

export interface DashboardData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyBalance: number
  categoriesBreakdown: {
    expenses: {
      _id: string
      total: number
      count: number
    }[]
    income: {
      _id: string
      total: number
      count: number
    }[]
  }
  monthlyTrend: {
    month: string
    income: number
    expenses: number
    balance: number
  }[]
}

export interface AISuggestion {
  category: string
  confidence: number
  explanation: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (name: string, username: string, password: string) => Promise<void>
  logout: () => void
}
