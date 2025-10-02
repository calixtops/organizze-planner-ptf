import mongoose, { Document, Schema } from 'mongoose'
import Decimal from 'decimal.js'

export interface ICreditCard extends Document {
  _id: string
  name: string
  bank: string
  limit: number
  currentBalance: number
  closingDay: number // Dia do fechamento da fatura (1-31)
  dueDay: number // Dia do vencimento da fatura (1-31)
  userId: string
  createdAt: Date
  updatedAt: Date
}

const CreditCardSchema = new Schema<ICreditCard>({
  name: {
    type: String,
    required: [true, 'Nome do cartão é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do cartão não pode ter mais de 100 caracteres']
  },
  bank: {
    type: String,
    required: [true, 'Banco é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do banco não pode ter mais de 100 caracteres']
  },
  limit: {
    type: Number,
    required: [true, 'Limite é obrigatório'],
    min: [0, 'Limite não pode ser negativo'],
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value)
      },
      message: 'Limite deve ser um número válido'
    }
  },
  currentBalance: {
    type: Number,
    required: [true, 'Saldo atual é obrigatório'],
    default: 0,
    min: [0, 'Saldo atual não pode ser negativo'],
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value)
      },
      message: 'Saldo atual deve ser um número válido'
    }
  },
  closingDay: {
    type: Number,
    required: [true, 'Dia de fechamento é obrigatório'],
    min: [1, 'Dia de fechamento deve ser entre 1 e 31'],
    max: [31, 'Dia de fechamento deve ser entre 1 e 31']
  },
  dueDay: {
    type: Number,
    required: [true, 'Dia de vencimento é obrigatório'],
    min: [1, 'Dia de vencimento deve ser entre 1 e 31'],
    max: [31, 'Dia de vencimento deve ser entre 1 e 31']
  },
  userId: {
    type: String,
    required: [true, 'ID do usuário é obrigatório'],
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes para otimizar consultas
CreditCardSchema.index({ userId: 1 })
CreditCardSchema.index({ userId: 1, bank: 1 })

// Middleware para garantir que os valores sejam tratados como Decimal
CreditCardSchema.pre('save', function(next) {
  if (this.isModified('limit') || this.isModified('currentBalance')) {
    const limitDecimal = new Decimal(this.limit)
    const balanceDecimal = new Decimal(this.currentBalance)
    
    this.limit = limitDecimal.toNumber()
    this.currentBalance = balanceDecimal.toNumber()
  }
  next()
})

// Validação customizada para verificar se o saldo não excede o limite
CreditCardSchema.pre('save', function(next) {
  if (this.isModified('currentBalance')) {
    const limitDecimal = new Decimal(this.limit)
    const balanceDecimal = new Decimal(this.currentBalance)
    
    if (balanceDecimal.greaterThan(limitDecimal)) {
      return next(new Error('Saldo atual não pode exceder o limite do cartão'))
    }
  }
  next()
})

// Método para atualizar saldo de forma segura
CreditCardSchema.methods.updateBalance = function(amount: number, operation: 'add' | 'subtract') {
  const currentBalance = new Decimal(this.currentBalance)
  const amountDecimal = new Decimal(amount)
  const limitDecimal = new Decimal(this.limit)
  
  let newBalance: Decimal
  
  if (operation === 'add') {
    newBalance = currentBalance.add(amountDecimal)
  } else {
    newBalance = currentBalance.sub(amountDecimal)
  }
  
  // Verificar se não excede o limite
  if (newBalance.greaterThan(limitDecimal)) {
    throw new Error('Operação excederia o limite do cartão')
  }
  
  // Verificar se não fica negativo
  if (newBalance.lessThan(0)) {
    throw new Error('Saldo do cartão não pode ser negativo')
  }
  
  this.currentBalance = newBalance.toNumber()
  return this.save()
}

// Método para calcular limite disponível
CreditCardSchema.methods.getAvailableLimit = function() {
  const limitDecimal = new Decimal(this.limit)
  const balanceDecimal = new Decimal(this.currentBalance)
  return limitDecimal.sub(balanceDecimal).toNumber()
}

export default mongoose.model<ICreditCard>('CreditCard', CreditCardSchema)
