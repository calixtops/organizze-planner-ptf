import mongoose, { Document, Schema } from 'mongoose'
import Decimal from 'decimal.js'

export interface ITransaction extends Document {
  _id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  nature?: 'fixed' | 'variable'
  category: string
  status: 'paid' | 'pending'
  date: Date
  accountId?: string
  creditCardId?: string
  userId: string
  groupId?: string // Mantido para compatibilidade
  isFamily?: boolean // true = Familiar, false/undefined = Pessoal
  paidBy?: string // ID ou nome de quem pagou (para controle familiar)
  aiCategory?: string // Categoria sugerida pela IA
  aiExplanation?: string // Explicação da IA para a categoria
  aiConfidence?: number // Confiança da IA (0-1)
  installmentInfo?: {
    planId: string
    current: number
    total: number
  }
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>({
  description: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    maxlength: [200, 'Descrição não pode ter mais de 200 caracteres']
  },
  amount: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0, 'Valor não pode ser negativo'],
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value) && value > 0
      },
      message: 'Valor deve ser um número positivo válido'
    }
  },
  type: {
    type: String,
    required: [true, 'Tipo da transação é obrigatório'],
    enum: {
      values: ['income', 'expense'],
      message: 'Tipo deve ser: income ou expense'
    }
  },
  nature: {
    type: String,
    enum: {
      values: ['fixed', 'variable'],
      message: 'Natureza deve ser: fixed ou variable'
    },
    default: 'variable'
  },
  category: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    trim: true,
    maxlength: [50, 'Categoria não pode ter mais de 50 caracteres']
  },
  status: {
    type: String,
    required: [true, 'Status é obrigatório'],
    enum: {
      values: ['paid', 'pending'],
      message: 'Status deve ser: paid ou pending'
    },
    default: 'paid'
  },
  date: {
    type: Date,
    required: [true, 'Data é obrigatória'],
    default: Date.now
  },
  accountId: {
    type: String,
    ref: 'Account'
  },
  creditCardId: {
    type: String,
    ref: 'CreditCard'
  },
  userId: {
    type: String,
    required: [true, 'ID do usuário é obrigatório'],
    ref: 'User'
  },
  groupId: {
    type: String,
    ref: 'Group'
  },
  isFamily: {
    type: Boolean,
    default: false
  },
  paidBy: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome de quem pagou não pode ter mais de 100 caracteres']
  },
  installmentInfo: {
    type: {
      planId: { type: String, required: true },
      current: { type: Number, required: true, min: 1 },
      total: { type: Number, required: true, min: 1 }
    },
    required: false
  },
  aiCategory: {
    type: String,
    trim: true,
    maxlength: [50, 'Categoria da IA não pode ter mais de 50 caracteres']
  },
  aiExplanation: {
    type: String,
    trim: true,
    maxlength: [500, 'Explicação da IA não pode ter mais de 500 caracteres']
  },
  aiConfidence: {
    type: Number,
    min: [0, 'Confiança da IA deve ser entre 0 e 1'],
    max: [1, 'Confiança da IA deve ser entre 0 e 1']
  }
}, {
  timestamps: true
})

// Indexes para otimizar consultas
TransactionSchema.index({ userId: 1 })
TransactionSchema.index({ userId: 1, date: -1 })
TransactionSchema.index({ userId: 1, type: 1 })
TransactionSchema.index({ groupId: 1, date: -1 })
TransactionSchema.index({ nature: 1 })
TransactionSchema.index({ userId: 1, category: 1 })
TransactionSchema.index({ userId: 1, status: 1 })
TransactionSchema.index({ accountId: 1 })
TransactionSchema.index({ creditCardId: 1 })

// Middleware para garantir que o valor seja tratado como Decimal
TransactionSchema.pre('save', function(next) {
  if (this.isModified('amount')) {
    const amountDecimal = new Decimal(this.amount)
    this.amount = amountDecimal.toNumber()
  }
  next()
})

// Método estático para calcular total de receitas por período
TransactionSchema.statics.getTotalIncome = async function(
  userId: string, 
  startDate: Date, 
  endDate: Date
) {
  const transactions = await this.find({
    userId,
    type: 'income',
    status: 'paid',
    date: { $gte: startDate, $lte: endDate }
  })
  
  let total = new Decimal(0)
  transactions.forEach((transaction: any) => {
    total = total.add(new Decimal(transaction.amount))
  })
  
  return total.toNumber()
}

// Método estático para calcular total de despesas por período
TransactionSchema.statics.getTotalExpenses = async function(
  userId: string, 
  startDate: Date, 
  endDate: Date
) {
  const transactions = await this.find({
    userId,
    type: 'expense',
    status: 'paid',
    date: { $gte: startDate, $lte: endDate }
  })
  
  let total = new Decimal(0)
  transactions.forEach((transaction: any) => {
    total = total.add(new Decimal(transaction.amount))
  })
  
  return total.toNumber()
}

// Método estático para obter breakdown por categoria
TransactionSchema.statics.getCategoryBreakdown = async function(
  userId: string,
  startDate: Date,
  endDate: Date,
  type: 'income' | 'expense'
) {
  const pipeline = [
    {
      $match: {
        userId,
        type,
        status: 'paid',
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { total: -1 as any }
    }
  ]
  
  return await this.aggregate(pipeline)
}

TransactionSchema.statics.getDashboardSummary = async function(
  userId: string,
  options?: { groupId?: string }
) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const matchBase: any = { status: 'paid' }
  if (options?.groupId) {
    matchBase.groupId = options.groupId
  } else {
    matchBase.userId = userId
  }

  const monthlyMatch = { ...matchBase, date: { $gte: startOfMonth, $lte: endOfMonth } }

  const [monthlyIncome] = await this.aggregate([
    { $match: { ...monthlyMatch, type: 'income' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])

  const [monthlyExpenses] = await this.aggregate([
    { $match: { ...monthlyMatch, type: 'expense' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ])

  const categoriesBreakdownExpense = await this.aggregate([
    { $match: { ...monthlyMatch, type: 'expense' } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ])

  const categoriesBreakdownIncome = await this.aggregate([
    { $match: { ...monthlyMatch, type: 'income' } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ])

  // Últimos 6 meses
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const monthlyTrendRaw = await this.aggregate([
    { $match: { ...matchBase, date: { $gte: sixMonthsAgo, $lte: endOfMonth } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        expenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ])

  // Garantir meses contínuos
  const monthlyTrend: Array<{ month: string, income: number, expenses: number, balance: number }> = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const found = monthlyTrendRaw.find((item: any) => item._id === key)
    const income = found?.income || 0
    const expenses = found?.expenses || 0
    monthlyTrend.push({
      month: key,
      income,
      expenses,
      balance: income - expenses
    })
  }

  const incomeTotal = monthlyIncome?.total || 0
  const expensesTotal = monthlyExpenses?.total || 0
  const monthlyBalance = incomeTotal - expensesTotal

  return {
    totalBalance: monthlyBalance,
    monthlyIncome: incomeTotal,
    monthlyExpenses: expensesTotal,
    monthlyBalance,
    categoriesBreakdown: {
      expenses: categoriesBreakdownExpense,
      income: categoriesBreakdownIncome
    },
    monthlyTrend
  }
}

export default mongoose.model<ITransaction>('Transaction', TransactionSchema)
