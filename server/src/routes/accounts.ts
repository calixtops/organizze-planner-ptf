import express from 'express'
import Account from '../models/Account.js'
import { authenticateToken } from '../middleware/auth.js'
import { 
  validateAccount, 
  validateAccountId, 
  validatePagination 
} from '../middleware/validation.js'

const router = express.Router()

// @route   GET /api/accounts
// @desc    Listar todas as contas do usuário
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const skip = (page - 1) * limit

    const accounts = await Account.find({ userId: req.user!._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Account.countDocuments({ userId: req.user!._id })

    res.json({
      accounts,
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

// @route   GET /api/accounts/:id
// @desc    Obter conta específica
// @access  Private
router.get('/:id', authenticateToken, validateAccountId, async (req, res, next) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!account) {
      return res.status(404).json({
        error: 'Conta não encontrada'
      })
    }

    res.json(account)
  } catch (error: any) {
    next(error)
  }
})

// @route   POST /api/accounts
// @desc    Criar nova conta
// @access  Private
router.post('/', authenticateToken, validateAccount, async (req, res, next) => {
  try {
    const { name, type, balance, bank } = req.body

    const account = new Account({
      name,
      type,
      balance: balance || 0,
      bank,
      userId: req.user!._id
    })

    await account.save()

    res.status(201).json({
      message: 'Conta criada com sucesso',
      account
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   PUT /api/accounts/:id
// @desc    Atualizar conta
// @access  Private
router.put('/:id', authenticateToken, validateAccountId, async (req, res, next) => {
  try {
    const { name, type, balance, bank } = req.body

    // Verificar se a conta pertence ao usuário
    const existingAccount = await Account.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!existingAccount) {
      return res.status(404).json({
        error: 'Conta não encontrada'
      })
    }

    const updates: any = {}
    if (name !== undefined) updates.name = name.trim()
    if (type !== undefined) updates.type = type
    if (balance !== undefined) updates.balance = balance
    if (bank !== undefined) updates.bank = bank?.trim()

    const account = await Account.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )

    res.json({
      message: 'Conta atualizada com sucesso',
      account
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   DELETE /api/accounts/:id
// @desc    Deletar conta
// @access  Private
router.delete('/:id', authenticateToken, validateAccountId, async (req, res, next) => {
  try {
    const account = await Account.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!account) {
      return res.status(404).json({
        error: 'Conta não encontrada'
      })
    }

    res.json({
      message: 'Conta deletada com sucesso'
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   GET /api/accounts/summary/balance
// @desc    Obter resumo do saldo total
// @access  Private
router.get('/summary/balance', authenticateToken, async (req, res, next) => {
  try {
    const totalBalance = await (Account as any).getTotalBalance(req.user!._id)
    
    const accountsByType = await Account.aggregate([
      { $match: { userId: req.user!._id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$balance' },
          count: { $sum: 1 }
        }
      }
    ])

    res.json({
      totalBalance,
      breakdown: accountsByType
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   PUT /api/accounts/:id/balance
// @desc    Atualizar saldo da conta
// @access  Private
router.put('/:id/balance', authenticateToken, validateAccountId, async (req, res, next) => {
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

    const account = await Account.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!account) {
      return res.status(404).json({
        error: 'Conta não encontrada'
      })
    }

    await (account as any).updateBalance(amount, operation)

    res.json({
      message: 'Saldo atualizado com sucesso',
      account
    })
  } catch (error: any) {
    next(error)
  }
})

export default router
