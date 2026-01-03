import mongoose, { Document, Schema } from 'mongoose'

export interface IInstallment extends Document {
  _id: string
  userId: string
  groupId?: string
  description: string
  totalAmount: number // Valor total do parcelamento
  installments: number // Número total de parcelas
  category: string
  startDate: Date // Data da primeira parcela
  currentPaid: number // Quantas parcelas já foram pagas
  status: 'active' | 'completed' | 'cancelled'
  paymentDay: number // Dia do mês para pagamento (1-31)
  groupId?: string // Mantido para compatibilidade
  isFamily?: boolean // true = Familiar, false/undefined = Pessoal
  paidBy?: string // Nome ou ID de quem está pagando o parcelamento
  createdAt: Date
  updatedAt: Date
}

const InstallmentSchema = new Schema<IInstallment>({
  userId: { type: String, required: true, ref: 'User' },
  groupId: { type: String, ref: 'Group' },
  description: { type: String, required: true, trim: true, maxlength: 200 },
  totalAmount: { type: Number, required: true, min: 0 },
  installments: { type: Number, required: true, min: 1, max: 120 },
  category: { type: String, required: true },
  startDate: { type: Date, required: true },
  currentPaid: { type: Number, default: 0, min: 0 },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled'], 
    default: 'active' 
  },
  paymentDay: { type: Number, required: true, min: 1, max: 31 },
  groupId: { type: String, ref: 'Group' },
  isFamily: { type: Boolean, default: false },
  paidBy: { type: String, trim: true, maxlength: 100 }
}, { 
  timestamps: true 
})

// Índices
InstallmentSchema.index({ userId: 1, status: 1 })
InstallmentSchema.index({ groupId: 1 })
InstallmentSchema.index({ startDate: 1 })

// Método para calcular valor de cada parcela
InstallmentSchema.virtual('installmentAmount').get(function() {
  return this.totalAmount / this.installments
})

// Método para verificar se está completo
InstallmentSchema.methods.isCompleted = function() {
  return this.currentPaid >= this.installments
}

// Método para obter próxima data de vencimento
InstallmentSchema.methods.getNextDueDate = function() {
  const start = new Date(this.startDate)
  const nextMonth = new Date(start)
  nextMonth.setMonth(start.getMonth() + this.currentPaid)
  nextMonth.setDate(this.paymentDay)
  return nextMonth
}

export default mongoose.model<IInstallment>('Installment', InstallmentSchema)

