import mongoose, { Document, Schema } from 'mongoose'

export interface IFamilyMember extends Document {
  _id: string
  name: string
  userId: string // Usuário dono desta lista de membros
  color?: string // Cor para representar visualmente
  createdAt: Date
  updatedAt: Date
}

const FamilyMemberSchema = new Schema<IFamilyMember>({
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 100 
  },
  userId: { 
    type: String, 
    required: true, 
    ref: 'User' 
  },
  color: {
    type: String,
    default: '#3498db'
  }
}, { timestamps: true })

// Índices
FamilyMemberSchema.index({ userId: 1 })
FamilyMemberSchema.index({ userId: 1, name: 1 }, { unique: true }) // Nome único por usuário

export default mongoose.model<IFamilyMember>('FamilyMember', FamilyMemberSchema)

