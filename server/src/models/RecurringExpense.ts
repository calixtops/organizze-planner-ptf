import mongoose, { Document, Schema } from 'mongoose'

export interface IRecurringExpense extends Document {
  _id: string
  userId: string
  description: string
  amount: number
  category: string
  dayOfMonth: number // Dia do mês em que o gasto ocorre (1-31)
  groupId?: string // Mantido para compatibilidade
  isFamily?: boolean // true = Familiar, false/undefined = Pessoal
  paidBy?: string
  isActive: boolean
  lastGenerated?: Date // Última data em que foi gerada uma transação
  createdAt: Date
  updatedAt: Date
}

const RecurringExpenseSchema = new Schema<IRecurringExpense>({
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  dayOfMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 31
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
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastGenerated: {
    type: Date
  }
}, { timestamps: true })

// Índices
RecurringExpenseSchema.index({ userId: 1, isActive: 1 })
RecurringExpenseSchema.index({ userId: 1, dayOfMonth: 1 })

export default mongoose.model<IRecurringExpense>('RecurringExpense', RecurringExpenseSchema)

