import express from 'express'
import Group from '../models/Group.js'
import Membership from '../models/Membership.js'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'
import { validateGroupCreate, validateGroupId, validateMemberAdd } from '../middleware/validation.js'

const router = express.Router()

const ensureMembership = async (userId: string, groupId: string) => {
  return Membership.findOne({ userId, groupId })
}

// @route   GET /api/groups
// @desc    Listar grupos do usuário
// @access  Private
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const memberships = await Membership.find({ userId: req.user!._id }).lean()
    const groupIds = memberships.map(m => m.groupId)

    if (!groupIds.length) {
      return res.json({ groups: [], memberships: [] })
    }

    const groups = await Group.find({ _id: { $in: groupIds } }).lean()

    res.json({ groups, memberships })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/groups
// @desc    Criar grupo
// @access  Private
router.post('/', authenticateToken, validateGroupCreate, async (req, res, next) => {
  try {
    const { name } = req.body

    const existing = await Group.findOne({ name: name.trim(), ownerId: req.user!._id })
    if (existing) {
      return res.status(400).json({ error: 'Você já tem um grupo com este nome' })
    }

    const group = new Group({
      name: name.trim(),
      ownerId: req.user!._id
    })
    await group.save()

    await new Membership({
      userId: req.user!._id,
      groupId: group._id.toString(),
      role: 'owner'
    }).save()

    res.status(201).json({ message: 'Grupo criado com sucesso', group })
  } catch (error) {
    next(error)
  }
})

// @route   GET /api/groups/:id/members
// @desc    Listar membros do grupo
// @access  Private
router.get('/:id/members', authenticateToken, validateGroupId, async (req, res, next) => {
  try {
    const membership = await ensureMembership(req.user!._id, req.params.id)
    if (!membership) {
      return res.status(403).json({ error: 'Acesso não autorizado a este grupo' })
    }

    const members = await Membership.find({ groupId: req.params.id }).lean()
    res.json({ members })
  } catch (error) {
    next(error)
  }
})

// @route   POST /api/groups/:id/members
// @desc    Adicionar membro ao grupo
// @access  Private (somente owner)
router.post('/:id/members', authenticateToken, validateMemberAdd, async (req, res, next) => {
  try {
    const { username, role } = req.body
    const groupId = req.params.id

    const requesterMembership = await ensureMembership(req.user!._id, groupId)
    if (!requesterMembership || requesterMembership.role !== 'owner') {
      return res.status(403).json({ error: 'Apenas o dono do grupo pode adicionar membros' })
    }

    const userToAdd = await User.findOne({ username })
    if (!userToAdd) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const existingMembership = await Membership.findOne({ userId: userToAdd._id.toString(), groupId })
    if (existingMembership) {
      return res.status(400).json({ error: 'Usuário já é membro do grupo' })
    }

    const membership = new Membership({
      userId: userToAdd._id.toString(),
      groupId,
      role: role || 'member'
    })
    await membership.save()

    res.status(201).json({ message: 'Membro adicionado com sucesso', membership })
  } catch (error) {
    next(error)
  }
})

export default router

