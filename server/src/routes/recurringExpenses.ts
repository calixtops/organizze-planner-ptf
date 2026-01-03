import express from 'express'
import RecurringExpense from '../models/RecurringExpense.js'
import Transaction from '../models/Transaction.js'
import { authenticateToken } from '../middleware/auth.js'
import { body, validationResult } from 'express-validator'

const router = express.Router()

// Validação
const validateRecurringExpense = [
  body('description').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('amount').isFloat({ min: 0 }).withMessage('Valor deve ser positivo'),
  body('category').trim().notEmpty().withMessage('Categoria é obrigatória'),
  body('dayOfMonth').isInt({ min: 1, max: 31 }).withMessage('Dia do mês deve ser entre 1 e 31')
]

// @route   GET /api/recurring-expenses
// @desc    Listar gastos recorrentes do usuário
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { isActive } = req.query
    const filter: any = { userId: req.user!._id }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true'
    }

    const expenses = await RecurringExpense.find(filter).sort({ dayOfMonth: 1 })
    res.json(expenses)
  } catch (error) {
    console.error('Erro ao buscar gastos recorrentes:', error)
    res.status(500).json({ error: 'Erro ao buscar gastos recorrentes' })
  }
})

// @route   POST /api/recurring-expenses
// @desc    Criar novo gasto recorrente
// @access  Private
router.post('/', authenticateToken, validateRecurringExpense, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { description, amount, category, dayOfMonth, groupId, isFamily, paidBy } = req.body

    const expense = new RecurringExpense({
      userId: req.user!._id,
      description,
      amount,
      category,
      dayOfMonth: parseInt(dayOfMonth),
      groupId: groupId || undefined,
      isFamily: isFamily || false,
      paidBy: paidBy || undefined,
      isActive: true
    })

    await expense.save()
    res.status(201).json(expense)
  } catch (error: any) {
    console.error('Erro ao criar gasto recorrente:', error)
    res.status(500).json({ error: 'Erro ao criar gasto recorrente' })
  }
})

// @route   PUT /api/recurring-expenses/:id
// @desc    Atualizar gasto recorrente
// @access  Private
router.put('/:id', authenticateToken, validateRecurringExpense, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { description, amount, category, dayOfMonth, groupId, isFamily, paidBy, isActive } = req.body

    const expense = await RecurringExpense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      {
        description,
        amount,
        category,
        dayOfMonth: parseInt(dayOfMonth),
        groupId: groupId || undefined,
        isFamily: isFamily !== undefined ? isFamily : false,
        paidBy: paidBy || undefined,
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true, runValidators: true }
    )

    if (!expense) {
      return res.status(404).json({ error: 'Gasto recorrente não encontrado' })
    }

    res.json(expense)
  } catch (error: any) {
    console.error('Erro ao atualizar gasto recorrente:', error)
    res.status(500).json({ error: 'Erro ao atualizar gasto recorrente' })
  }
})

// @route   DELETE /api/recurring-expenses/:id
// @desc    Deletar gasto recorrente
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await RecurringExpense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!expense) {
      return res.status(404).json({ error: 'Gasto recorrente não encontrado' })
    }

    res.json({ message: 'Gasto recorrente deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar gasto recorrente:', error)
    res.status(500).json({ error: 'Erro ao deletar gasto recorrente' })
  }
})

// @route   POST /api/recurring-expenses/:id/generate
// @desc    Gerar transação a partir de um gasto recorrente
// @access  Private
router.post('/:id/generate', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.body // Opcional: especificar mês/ano, senão usa o atual

    const expense = await RecurringExpense.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!expense) {
      return res.status(404).json({ error: 'Gasto recorrente não encontrado' })
    }

    if (!expense.isActive) {
      return res.status(400).json({ error: 'Gasto recorrente está inativo' })
    }

    // Determinar a data da transação
    const now = new Date()
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth()
    const targetYear = year ? parseInt(year) : now.getFullYear()
    
    // Ajustar o dia se for maior que os dias do mês (ex: 31 em fevereiro)
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
    const day = Math.min(expense.dayOfMonth, daysInMonth)

    const transactionDate = new Date(targetYear, targetMonth, day)

    // Verificar se já existe uma transação para este mês
    const startOfMonth = new Date(targetYear, targetMonth, 1)
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

    const existingTransaction = await Transaction.findOne({
      userId: expense.userId,
      description: expense.description,
      amount: expense.amount,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      nature: 'fixed'
    })

    if (existingTransaction) {
      return res.status(400).json({ 
        error: 'Transação para este mês já foi gerada',
        transaction: existingTransaction
      })
    }

    // Criar a transação
    const transaction = new Transaction({
      userId: expense.userId,
      description: expense.description,
      amount: expense.amount,
      type: 'expense',
      nature: 'fixed',
      category: expense.category,
      status: 'paid',
      date: transactionDate,
      groupId: expense.groupId,
      isFamily: expense.isFamily || false,
      paidBy: expense.paidBy
    })

    await transaction.save()

    // Atualizar lastGenerated
    expense.lastGenerated = transactionDate
    await expense.save()

    res.status(201).json({
      message: 'Transação gerada com sucesso',
      transaction
    })
  } catch (error: any) {
    console.error('Erro ao gerar transação:', error)
    res.status(500).json({ error: 'Erro ao gerar transação' })
  }
})

// @route   POST /api/recurring-expenses/generate-all
// @desc    Gerar todas as transações pendentes dos gastos recorrentes ativos
// @access  Private
router.post('/generate-all', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.body // Opcional

    const expenses = await RecurringExpense.find({
      userId: req.user!._id,
      isActive: true
    })

    const now = new Date()
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth()
    const targetYear = year ? parseInt(year) : now.getFullYear()

    const generated: any[] = []
    const skipped: any[] = []

    for (const expense of expenses) {
      try {
        // Verificar se já existe
        const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
        const day = Math.min(expense.dayOfMonth, daysInMonth)
        const transactionDate = new Date(targetYear, targetMonth, day)

        const startOfMonth = new Date(targetYear, targetMonth, 1)
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999)

        const existing = await Transaction.findOne({
          userId: expense.userId,
          description: expense.description,
          amount: expense.amount,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          nature: 'fixed'
        })

        if (existing) {
          skipped.push({ expense: expense.description, reason: 'Já existe' })
          continue
        }

        // Criar transação
        const transaction = new Transaction({
          userId: expense.userId,
          description: expense.description,
          amount: expense.amount,
          type: 'expense',
          nature: 'fixed',
          category: expense.category,
          status: 'paid',
          date: transactionDate,
          groupId: expense.groupId,
          isFamily: expense.isFamily || false,
          paidBy: expense.paidBy
        })

        await transaction.save()
        expense.lastGenerated = transactionDate
        await expense.save()

        generated.push({ expense: expense.description, transaction: transaction._id })
      } catch (error: any) {
        skipped.push({ expense: expense.description, reason: error.message })
      }
    }

    res.json({
      message: `Geradas ${generated.length} transações`,
      generated,
      skipped
    })
  } catch (error: any) {
    console.error('Erro ao gerar todas as transações:', error)
    res.status(500).json({ error: 'Erro ao gerar transações' })
  }
})

export default router

