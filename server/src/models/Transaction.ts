import mongoose, { Document, Schema } from 'mongoose'
import Decimal from 'decimal.js'

export interface ITransaction extends Document {
  _id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  status: 'paid' | 'pending'
  date: Date
  accountId?: string
  creditCardId?: string
  userId: string
  aiCategory?: string // Categoria sugerida pela IA
  aiExplanation?: string // Explicação da IA para a categoria
  aiConfidence?: number // Confiança da IA (0-1)
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

// Validação customizada para verificar se pelo menos uma conta está associada
TransactionSchema.pre('save', function(next) {
  if (!this.accountId && !this.creditCardId) {
    return next(new Error('Transação deve estar associada a uma conta ou cartão de crédito'))
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

export default mongoose.model<ITransaction>('Transaction', TransactionSchema)
