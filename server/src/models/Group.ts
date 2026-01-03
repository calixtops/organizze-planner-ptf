import mongoose, { Document, Schema } from 'mongoose'

export interface IGroup extends Document {
  _id: string
  name: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

const GroupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: [true, 'Nome do grupo é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome do grupo não pode ter mais de 100 caracteres']
  },
  ownerId: {
    type: String,
    required: [true, 'Proprietário do grupo é obrigatório'],
    ref: 'User'
  }
}, {
  timestamps: true
})

GroupSchema.index({ ownerId: 1 })
GroupSchema.index({ name: 1, ownerId: 1 }, { unique: true })

export default mongoose.model<IGroup>('Group', GroupSchema)

