import express from 'express'
import Transaction from '../models/Transaction.js'
import Account from '../models/Account.js'
import CreditCard from '../models/CreditCard.js'
import { authenticateToken } from '../middleware/auth.js'
import { 
  validateTransaction, 
  validateTransactionId, 
  validatePagination,
  validateDateRange
} from '../middleware/validation.js'
import Decimal from 'decimal.js'

const router = express.Router()

// @route   GET /api/transactions
// @desc    Listar transações do usuário
// @access  Private
router.get('/', authenticateToken, validatePagination, validateDateRange, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit
    
    // Filtros
    const filters: any = { userId: req.user!._id }
    
    if (req.query.type) {
      filters.type = req.query.type
    }
    
    if (req.query.category) {
      filters.category = new RegExp(req.query.category as string, 'i')
    }
    
    if (req.query.status) {
      filters.status = req.query.status
    }
    
    if (req.query.accountId) {
      filters.accountId = req.query.accountId
    }
    
    if (req.query.creditCardId) {
      filters.creditCardId = req.query.creditCardId
    }
    
    // Filtro por data
    if (req.query.startDate || req.query.endDate) {
      filters.date = {}
      if (req.query.startDate) {
        filters.date.$gte = new Date(req.query.startDate as string)
      }
      if (req.query.endDate) {
        filters.date.$lte = new Date(req.query.endDate as string)
      }
    }

    const transactions = await Transaction.find(filters)
      .populate('accountId', 'name type')
      .populate('creditCardId', 'name bank')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Transaction.countDocuments(filters)

    res.json({
      transactions,
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

// @route   GET /api/transactions/:id
// @desc    Obter transação específica
// @access  Private
router.get('/:id', authenticateToken, validateTransactionId, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })
      .populate('accountId', 'name type')
      .populate('creditCardId', 'name bank')

    if (!transaction) {
      return res.status(404).json({
        error: 'Transação não encontrada'
      })
    }

    res.json(transaction)
  } catch (error: any) {
    next(error)
  }
})

// @route   POST /api/transactions
// @desc    Criar nova transação
// @access  Private
router.post('/', authenticateToken, validateTransaction, async (req, res, next) => {
  try {
    const { 
      description, 
      amount, 
      type, 
      category, 
      status, 
      date, 
      accountId, 
      creditCardId 
    } = req.body

    // Verificar se a conta/cartão pertence ao usuário
    if (accountId) {
      const account = await Account.findOne({
        _id: accountId,
        userId: req.user!._id
      })
      
      if (!account) {
        return res.status(404).json({
          error: 'Conta não encontrada'
        })
      }
    }

    if (creditCardId) {
      const creditCard = await CreditCard.findOne({
        _id: creditCardId,
        userId: req.user!._id
      })
      
      if (!creditCard) {
        return res.status(404).json({
          error: 'Cartão de crédito não encontrado'
        })
      }
    }

    const transaction = new Transaction({
      description,
      amount,
      type,
      category,
      status: status || 'paid',
      date: date ? new Date(date) : new Date(),
      accountId,
      creditCardId,
      userId: req.user!._id
    })

    await transaction.save()

    // Atualizar saldo da conta ou cartão se a transação estiver paga
    if (transaction.status === 'paid') {
      if (accountId) {
        const account = await Account.findById(accountId)
        if (account) {
          const operation = type === 'income' ? 'add' : 'subtract'
          await (account as any).updateBalance(amount, operation)
        }
      }

      if (creditCardId && type === 'expense') {
        const creditCard = await CreditCard.findById(creditCardId)
        if (creditCard) {
          await (creditCard as any).updateBalance(amount, 'add')
        }
      }
    }

    // Buscar a transação com os dados populados
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('accountId', 'name type')
      .populate('creditCardId', 'name bank')

    res.status(201).json({
      message: 'Transação criada com sucesso',
      transaction: populatedTransaction
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   PUT /api/transactions/:id
// @desc    Atualizar transação
// @access  Private
router.put('/:id', authenticateToken, validateTransactionId, async (req, res, next) => {
  try {
    const { 
      description, 
      amount, 
      type, 
      category, 
      status, 
      date, 
      accountId, 
      creditCardId 
    } = req.body

    // Buscar transação existente
    const existingTransaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!existingTransaction) {
      return res.status(404).json({
        error: 'Transação não encontrada'
      })
    }

    // Reverter alterações no saldo da transação original
    if (existingTransaction.status === 'paid') {
      if (existingTransaction.accountId) {
        const account = await Account.findById(existingTransaction.accountId)
        if (account) {
          const operation = existingTransaction.type === 'income' ? 'subtract' : 'add'
          await (account as any).updateBalance(existingTransaction.amount, operation)
        }
      }

      if (existingTransaction.creditCardId && existingTransaction.type === 'expense') {
        const creditCard = await CreditCard.findById(existingTransaction.creditCardId)
        if (creditCard) {
          await (creditCard as any).updateBalance(existingTransaction.amount, 'subtract')
        }
      }
    }

    // Verificar novas contas/cartões
    if (accountId) {
      const account = await Account.findOne({
        _id: accountId,
        userId: req.user!._id
      })
      
      if (!account) {
        return res.status(404).json({
          error: 'Conta não encontrada'
        })
      }
    }

    if (creditCardId) {
      const creditCard = await CreditCard.findOne({
        _id: creditCardId,
        userId: req.user!._id
      })
      
      if (!creditCard) {
        return res.status(404).json({
          error: 'Cartão de crédito não encontrado'
        })
      }
    }

    // Atualizar transação
    const updates: any = {}
    if (description !== undefined) updates.description = description.trim()
    if (amount !== undefined) updates.amount = amount
    if (type !== undefined) updates.type = type
    if (category !== undefined) updates.category = category.trim()
    if (status !== undefined) updates.status = status
    if (date !== undefined) updates.date = new Date(date)
    if (accountId !== undefined) updates.accountId = accountId
    if (creditCardId !== undefined) updates.creditCardId = creditCardId

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )

    // Aplicar alterações no saldo se a transação estiver paga
    const newStatus = status !== undefined ? status : existingTransaction.status
    const newAmount = amount !== undefined ? amount : existingTransaction.amount
    const newType = type !== undefined ? type : existingTransaction.type
    const newAccountId = accountId !== undefined ? accountId : existingTransaction.accountId
    const newCreditCardId = creditCardId !== undefined ? creditCardId : existingTransaction.creditCardId

    if (newStatus === 'paid') {
      if (newAccountId) {
        const account = await Account.findById(newAccountId)
        if (account) {
          const operation = newType === 'income' ? 'add' : 'subtract'
          await (account as any).updateBalance(newAmount, operation)
        }
      }

      if (newCreditCardId && newType === 'expense') {
        const creditCard = await CreditCard.findById(newCreditCardId)
        if (creditCard) {
          await (creditCard as any).updateBalance(newAmount, 'add')
        }
      }
    }

    // Buscar a transação atualizada com os dados populados
    const populatedTransaction = await Transaction.findById(transaction!._id)
      .populate('accountId', 'name type')
      .populate('creditCardId', 'name bank')

    res.json({
      message: 'Transação atualizada com sucesso',
      transaction: populatedTransaction
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   DELETE /api/transactions/:id
// @desc    Deletar transação
// @access  Private
router.delete('/:id', authenticateToken, validateTransactionId, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!transaction) {
      return res.status(404).json({
        error: 'Transação não encontrada'
      })
    }

    // Reverter alterações no saldo se a transação estiver paga
    if (transaction.status === 'paid') {
      if (transaction.accountId) {
        const account = await Account.findById(transaction.accountId)
        if (account) {
          const operation = transaction.type === 'income' ? 'subtract' : 'add'
          await (account as any).updateBalance(transaction.amount, operation)
        }
      }

      if (transaction.creditCardId && transaction.type === 'expense') {
        const creditCard = await CreditCard.findById(transaction.creditCardId)
        if (creditCard) {
          await (creditCard as any).updateBalance(transaction.amount, 'subtract')
        }
      }
    }

    await Transaction.findByIdAndDelete(req.params.id)

    res.json({
      message: 'Transação deletada com sucesso'
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   GET /api/transactions/summary/dashboard
// @desc    Obter dados para o dashboard
// @access  Private
router.get('/summary/dashboard', authenticateToken, async (req, res, next) => {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Saldo total das contas
    const totalBalance = await (Account as any).getTotalBalance(req.user!._id)

    // Receitas e despesas do mês
    const [monthlyIncome, monthlyExpenses] = await Promise.all([
      (Transaction as any).getTotalIncome(req.user!._id, startOfMonth, endOfMonth),
      (Transaction as any).getTotalExpenses(req.user!._id, startOfMonth, endOfMonth)
    ])

    // Breakdown por categoria (despesas)
    const expensesBreakdown = await (Transaction as any).getCategoryBreakdown(
      req.user!._id,
      startOfMonth,
      endOfMonth,
      'expense'
    )

    // Breakdown por categoria (receitas)
    const incomeBreakdown = await (Transaction as any).getCategoryBreakdown(
      req.user!._id,
      startOfMonth,
      endOfMonth,
      'income'
    )

    // Evolução mensal (últimos 6 meses)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const [income, expenses] = await Promise.all([
        (Transaction as any).getTotalIncome(req.user!._id, monthStart, monthEnd),
        (Transaction as any).getTotalExpenses(req.user!._id, monthStart, monthEnd)
      ])
      
      monthlyTrend.push({
        month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        income,
        expenses,
        balance: income - expenses
      })
    }

    res.json({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance: monthlyIncome - monthlyExpenses,
      categoriesBreakdown: {
        expenses: expensesBreakdown,
        income: incomeBreakdown
      },
      monthlyTrend
    })
  } catch (error: any) {
    next(error)
  }
})

export default router
