import express from 'express'
import CreditCard from '../models/CreditCard.js'
import { authenticateToken } from '../middleware/auth.js'
import { 
  validateCreditCard, 
  validateCreditCardId, 
  validatePagination 
} from '../middleware/validation.js'

const router = express.Router()

// @route   GET /api/credit-cards
// @desc    Listar todos os cartões do usuário
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

    const creditCards = await CreditCard.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await CreditCard.countDocuments({ userId: req.user!._id })

    res.json({
      creditCards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   GET /api/credit-cards/:id
// @desc    Obter cartão específico
// @access  Private
router.get('/:id', authenticateToken, validateCreditCardId, async (req, res, next) => {
  try {
    const creditCard = await CreditCard.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!creditCard) {
      return res.status(404).json({
        error: 'Cartão de crédito não encontrado'
      })
    }

    res.json(creditCard)
  } catch (error: any) {
    next(error)
  }
})

// @route   POST /api/credit-cards
// @desc    Criar novo cartão de crédito
// @access  Private
router.post('/', authenticateToken, validateCreditCard, async (req, res, next) => {
  try {
    const { name, bank, limit, currentBalance, closingDay, dueDay } = req.body

    const creditCard = new CreditCard({
      name,
      bank,
      limit,
      currentBalance: currentBalance || 0,
      closingDay,
      dueDay,
      userId: req.user!._id
    })

    await creditCard.save()

    res.status(201).json({
      message: 'Cartão de crédito criado com sucesso',
      creditCard
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   PUT /api/credit-cards/:id
// @desc    Atualizar cartão de crédito
// @access  Private
router.put('/:id', authenticateToken, validateCreditCardId, async (req, res, next) => {
  try {
    const { name, bank, limit, currentBalance, closingDay, dueDay } = req.body

    // Verificar se o cartão pertence ao usuário
    const existingCreditCard = await CreditCard.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!existingCreditCard) {
      return res.status(404).json({
        error: 'Cartão de crédito não encontrado'
      })
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (bank !== undefined) updates.bank = bank.trim()
    if (limit !== undefined) updates.limit = limit
    if (currentBalance !== undefined) updates.currentBalance = currentBalance
    if (closingDay !== undefined) updates.closingDay = closingDay
    if (dueDay !== undefined) updates.dueDay = dueDay

    const creditCard = await CreditCard.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )

    res.json({
      message: 'Cartão de crédito atualizado com sucesso',
      creditCard
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   DELETE /api/credit-cards/:id
// @desc    Deletar cartão de crédito
// @access  Private
router.delete('/:id', authenticateToken, validateCreditCardId, async (req, res, next) => {
  try {
    const creditCard = await CreditCard.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!creditCard) {
      return res.status(404).json({
        error: 'Cartão de crédito não encontrado'
      })
    }

    res.json({
      message: 'Cartão de crédito deletado com sucesso'
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   GET /api/credit-cards/summary/totals
// @desc    Obter resumo dos cartões
// @access  Private
router.get('/summary/totals', authenticateToken, async (req, res, next) => {
  try {
    const creditCards = await CreditCard.find({ userId: req.user!._id })
    
    let totalLimit = 0
    let totalCurrentBalance = 0
    let totalAvailableLimit = 0

    creditCards.forEach(card => {
      totalLimit += card.limit
      totalCurrentBalance += card.currentBalance
      totalAvailableLimit += (card as any).getAvailableLimit()
    })

    res.json({
      totalLimit,
      totalCurrentBalance,
      totalAvailableLimit,
      creditCardsCount: creditCards.length
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   PUT /api/credit-cards/:id/balance
// @desc    Atualizar saldo do cartão
// @access  Private
router.put('/:id/balance', authenticateToken, validateCreditCardId, async (req, res, next) => {
  try {
    const { amount, operation } = req.body

    if (!amount || !operation) {
      return res.status(400).json({
        error: 'Valor e operação são obrigatórios'
      })
    }

    if (!['add', 'subtract'].includes(operation)) {
      return res.status(400).json({
        error: 'Operação deve ser: add ou subtract'
      })
    }

    const creditCard = await CreditCard.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!creditCard) {
      return res.status(404).json({
        error: 'Cartão de crédito não encontrado'
      })
    }

    await (creditCard as any).updateBalance(amount, operation)

    res.json({
      message: 'Saldo atualizado com sucesso',
      creditCard
    })
  } catch (error: any) {
    next(error)
  }
})

export default router
