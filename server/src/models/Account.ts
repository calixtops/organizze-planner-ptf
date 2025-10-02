import mongoose, { Document, Schema } from 'mongoose'
import Decimal from 'decimal.js'

export interface IAccount extends Document {
  _id: string
  name: string
  type: 'checking' | 'savings' | 'investment' | 'credit'
  balance: number // Armazenado como número, mas sempre tratado como Decimal
  bank?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

const AccountSchema = new Schema<IAccount>({
  name: {
    type: String,
    required: [true, 'Nome da conta é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome da conta não pode ter mais de 100 caracteres']
  },
  type: {
    type: String,
    required: [true, 'Tipo da conta é obrigatório'],
    enum: {
      values: ['checking', 'savings', 'investment', 'credit'],
      message: 'Tipo de conta deve ser: checking, savings, investment ou credit'
    }
  },
  balance: {
    type: Number,
    required: [true, 'Saldo é obrigatório'],
    default: 0,
    validate: {
      validator: function(value: number) {
        return !isNaN(value) && isFinite(value)
      },
      message: 'Saldo deve ser um número válido'
    }
  },
  bank: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome do banco não pode ter mais de 100 caracteres']
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
AccountSchema.index({ userId: 1 })
AccountSchema.index({ userId: 1, type: 1 })

// Middleware para garantir que o saldo seja tratado como Decimal
AccountSchema.pre('save', function(next) {
  if (this.isModified('balance')) {
    // Converte para Decimal para garantir precisão, depois volta para número
    const decimalBalance = new Decimal(this.balance)
    this.balance = decimalBalance.toNumber()
  }
  next()
})

// Método para atualizar saldo de forma segura
AccountSchema.methods.updateBalance = function(amount: number, operation: 'add' | 'subtract') {
  const currentBalance = new Decimal(this.balance)
  const amountDecimal = new Decimal(amount)
  
  if (operation === 'add') {
    this.balance = currentBalance.add(amountDecimal).toNumber()
  } else {
    this.balance = currentBalance.sub(amountDecimal).toNumber()
  }
  
  return this.save()
}

// Método estático para somar saldos de múltiplas contas
AccountSchema.statics.getTotalBalance = async function(userId: string) {
  const accounts = await this.find({ userId })
  let total = new Decimal(0)
  
  accounts.forEach((account: any) => {
    total = total.add(new Decimal(account.balance))
  })
  
  return total.toNumber()
}

export default mongoose.model<IAccount>('Account', AccountSchema)
