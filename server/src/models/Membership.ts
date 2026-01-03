import mongoose, { Document, Schema } from 'mongoose'

export type MembershipRole = 'owner' | 'member'

export interface IMembership extends Document {
  _id: string
  userId: string
  groupId: string
  role: MembershipRole
  createdAt: Date
  updatedAt: Date
}

const MembershipSchema = new Schema<IMembership>({
  userId: {
    type: String,
    required: [true, 'ID do usuário é obrigatório'],
    ref: 'User'
  },
  groupId: {
    type: String,
    required: [true, 'ID do grupo é obrigatório'],
    ref: 'Group'
  },
  role: {
    type: String,
    enum: {
      values: ['owner', 'member'],
      message: 'Papel deve ser owner ou member'
    },
    default: 'member'
  }
}, {
  timestamps: true
})

MembershipSchema.index({ userId: 1 })
MembershipSchema.index({ groupId: 1 })
MembershipSchema.index({ userId: 1, groupId: 1 }, { unique: true })

export default mongoose.model<IMembership>('Membership', MembershipSchema)

