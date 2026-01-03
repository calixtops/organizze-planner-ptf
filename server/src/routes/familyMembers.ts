import express from 'express'
import FamilyMember from '../models/FamilyMember.js'
import { authenticateToken } from '../middleware/auth.js'
import { body, validationResult } from 'express-validator'

const router = express.Router()

// Validação
const validateMember = [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('color').optional().isString()
]

// @route   GET /api/family-members
// @desc    Listar membros da família do usuário
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const members = await FamilyMember.find({ userId: req.user!._id }).sort({ name: 1 })
    res.json(members)
  } catch (error) {
    console.error('Erro ao buscar membros:', error)
    res.status(500).json({ error: 'Erro ao buscar membros' })
  }
})

// @route   POST /api/family-members
// @desc    Criar novo membro
// @access  Private
router.post('/', authenticateToken, validateMember, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, color } = req.body

    const member = new FamilyMember({
      name,
      color: color || '#3498db',
      userId: req.user!._id
    })

    await member.save()
    res.status(201).json(member)
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Já existe um membro com este nome' })
    }
    console.error('Erro ao criar membro:', error)
    res.status(500).json({ error: 'Erro ao criar membro' })
  }
})

// @route   PUT /api/family-members/:id
// @desc    Atualizar membro
// @access  Private
router.put('/:id', authenticateToken, validateMember, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, color } = req.body

    const member = await FamilyMember.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { name, color },
      { new: true, runValidators: true }
    )

    if (!member) {
      return res.status(404).json({ error: 'Membro não encontrado' })
    }

    res.json(member)
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Já existe um membro com este nome' })
    }
    console.error('Erro ao atualizar membro:', error)
    res.status(500).json({ error: 'Erro ao atualizar membro' })
  }
})

// @route   DELETE /api/family-members/:id
// @desc    Deletar membro
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const member = await FamilyMember.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!member) {
      return res.status(404).json({ error: 'Membro não encontrado' })
    }

    res.json({ message: 'Membro deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar membro:', error)
    res.status(500).json({ error: 'Erro ao deletar membro' })
  }
})

export default router

