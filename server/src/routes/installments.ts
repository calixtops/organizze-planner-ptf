import express from 'express'
import Installment from '../models/Installment.js'
import Transaction from '../models/Transaction.js'
import { authenticateToken } from '../middleware/auth.js'
import { body, query, validationResult } from 'express-validator'

const router = express.Router()

// Função auxiliar para calcular quantas parcelas já deveriam ter sido pagas
function calculatePaidInstallments(startDate: Date, paymentDay: number, totalInstallments: number): number {
  const now = new Date()
  const start = new Date(startDate)
  
  // Se a data de início é no futuro, nenhuma parcela foi paga
  if (start > now) {
    return 0
  }

  // Calcular quantos meses se passaram desde o início
  const yearsDiff = now.getFullYear() - start.getFullYear()
  const monthsDiff = now.getMonth() - start.getMonth()
  const daysDiff = now.getDate() - start.getDate()
  
  let totalMonths = yearsDiff * 12 + monthsDiff
  
  // Se já passou o dia de pagamento deste mês, conta este mês também
  if (daysDiff >= 0 && now.getDate() >= paymentDay) {
    totalMonths += 1
  }
  
  // Retornar o mínimo entre meses passados e total de parcelas
  return Math.min(Math.max(0, totalMonths), totalInstallments)
}

// Função para criar transação de uma parcela
async function createInstallmentTransaction(
  installment: any,
  installmentNumber: number,
  paymentDate: Date
) {
  const installmentAmount = installment.totalAmount / installment.installments
  
  const transaction = new Transaction({
    userId: installment.userId,
    groupId: installment.groupId,
    isFamily: installment.isFamily || false,
    description: `${installment.description} (Parcela ${installmentNumber}/${installment.installments})`,
    amount: installmentAmount,
    type: 'expense',
    nature: 'fixed',
    category: installment.category,
    status: 'paid',
    date: paymentDate,
    paidBy: installment.paidBy || undefined
  })
  
  await transaction.save()
  return transaction
}

// Middleware de validação
const validateInstallment = [
  body('description').trim().notEmpty().withMessage('Descrição é obrigatória'),
  body('totalAmount').isFloat({ min: 0.01 }).withMessage('Valor total deve ser maior que zero'),
  body('installments').isInt({ min: 1, max: 120 }).withMessage('Número de parcelas inválido'),
  body('category').trim().notEmpty().withMessage('Categoria é obrigatória'),
  body('startDate').isISO8601().withMessage('Data inicial inválida'),
  body('paymentDay').isInt({ min: 1, max: 31 }).withMessage('Dia de pagamento inválido'),
  body('groupId').optional().isString()
]

// @route   GET /api/installments
// @desc    Listar todos os parcelamentos do usuário
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, groupId, month } = req.query

    const filter: any = { userId: req.user!._id }

    if (status) {
      filter.status = status
    }

    if (groupId) {
      filter.groupId = groupId
    }

    // Se filtrar por mês, buscar parcelamentos que tenham parcela vencendo naquele mês
    if (month) {
      const [year, monthNum] = (month as string).split('-').map(Number)
      const startOfMonth = new Date(year, monthNum - 1, 1)
      const endOfMonth = new Date(year, monthNum, 0, 23, 59, 59)

      // Parcelamentos que começaram antes ou durante o mês
      filter.startDate = { $lte: endOfMonth }
      filter.status = { $in: ['active', 'completed'] }
    }

    const installments = await Installment.find(filter).sort({ startDate: -1 })

    // Se filtrar por mês, calcular qual parcela vence naquele mês
    if (month) {
      const [year, monthNum] = (month as string).split('-').map(Number)
      
      const installmentsInMonth = installments.filter(inst => {
        const startDate = new Date(inst.startDate)
        const startYear = startDate.getFullYear()
        const startMonth = startDate.getMonth() + 1

        // Calcular quantos meses se passaram desde o início
        const monthsPassed = (year - startYear) * 12 + (monthNum - startMonth)

        // Verificar se este parcelamento tem parcela vencendo neste mês
        return monthsPassed >= 0 && monthsPassed < inst.installments && monthsPassed >= inst.currentPaid
      })

      return res.json(installmentsInMonth)
    }

    res.json(installments)
  } catch (error) {
    console.error('Erro ao buscar parcelamentos:', error)
    res.status(500).json({ error: 'Erro ao buscar parcelamentos' })
  }
})

// @route   GET /api/installments/:id
// @desc    Obter um parcelamento específico
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const installment = await Installment.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!installment) {
      return res.status(404).json({ error: 'Parcelamento não encontrado' })
    }

    res.json(installment)
  } catch (error) {
    console.error('Erro ao buscar parcelamento:', error)
    res.status(500).json({ error: 'Erro ao buscar parcelamento' })
  }
})

// @route   POST /api/installments
// @desc    Criar novo parcelamento
// @access  Private
router.post('/', authenticateToken, validateInstallment, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { 
      description, 
      totalAmount, 
      installments, 
      category, 
      startDate, 
      paymentDay, 
      groupId,
      isFamily, // Opcional: se é gasto familiar ou pessoal
      paidBy, // Opcional: quem está pagando o parcelamento
      initialPaid, // Opcional: número de parcelas já pagas manualmente
      autoMarkPaid // Opcional: se true, calcula automaticamente baseado na data
    } = req.body

    const startDateObj = new Date(startDate)
    
    // Calcular quantas parcelas já foram pagas
    let paidCount = 0
    
    if (initialPaid !== undefined && initialPaid !== null) {
      // Se o usuário especificou manualmente, usar esse valor
      paidCount = Math.min(Math.max(0, parseInt(initialPaid)), installments)
    } else if (autoMarkPaid !== false) {
      // Por padrão, calcular automaticamente baseado na data
      paidCount = calculatePaidInstallments(startDateObj, paymentDay, installments)
    }

    const newInstallment = new Installment({
      userId: req.user!._id,
      description,
      totalAmount,
      installments,
      category,
      startDate: startDateObj,
      paymentDay,
      groupId: groupId || undefined,
      isFamily: isFamily || false,
      paidBy: paidBy || undefined,
      currentPaid: paidCount,
      status: paidCount >= installments ? 'completed' : 'active'
    })

    await newInstallment.save()

    // Criar transações para as parcelas já pagas
    const createdTransactions = []
    if (paidCount > 0) {
      for (let i = 1; i <= paidCount; i++) {
        // Calcular a data de cada parcela
        const paymentDate = new Date(startDateObj)
        paymentDate.setMonth(paymentDate.getMonth() + (i - 1))
        paymentDate.setDate(paymentDay)
        
        // Ajustar se o dia não existe no mês (ex: 31 em fevereiro)
        const daysInMonth = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0).getDate()
        if (paymentDay > daysInMonth) {
          paymentDate.setDate(daysInMonth)
        }

        const transaction = await createInstallmentTransaction(
          newInstallment,
          i,
          paymentDate
        )
        createdTransactions.push(transaction)
      }
    }

    res.status(201).json({
      installment: newInstallment,
      createdTransactions: createdTransactions.length,
      message: paidCount > 0 
        ? `${paidCount} parcela(s) marcada(s) como paga(s) automaticamente`
        : 'Parcelamento criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar parcelamento:', error)
    res.status(500).json({ error: 'Erro ao criar parcelamento' })
  }
})

// @route   PUT /api/installments/:id
// @desc    Atualizar parcelamento
// @access  Private
router.put('/:id', authenticateToken, validateInstallment, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { description, totalAmount, installments, category, startDate, paymentDay, groupId, isFamily, paidBy } = req.body

    const installment = await Installment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      {
        description,
        totalAmount,
        installments,
        category,
        startDate: new Date(startDate),
        paymentDay,
        groupId: groupId || undefined,
        isFamily: isFamily !== undefined ? isFamily : false,
        paidBy: paidBy || undefined
      },
      { new: true, runValidators: true }
    )

    if (!installment) {
      return res.status(404).json({ error: 'Parcelamento não encontrado' })
    }

    res.json(installment)
  } catch (error) {
    console.error('Erro ao atualizar parcelamento:', error)
    res.status(500).json({ error: 'Erro ao atualizar parcelamento' })
  }
})

// @route   PUT /api/installments/:id/pay
// @desc    Marcar parcela como paga
// @access  Private
router.put('/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { paymentDate } = req.body // Opcional: data do pagamento, senão usa a data calculada

    const installment = await Installment.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!installment) {
      return res.status(404).json({ error: 'Parcelamento não encontrado' })
    }

    if (installment.currentPaid >= installment.installments) {
      return res.status(400).json({ error: 'Parcelamento já está completo' })
    }

    // Calcular a data da próxima parcela
    let nextPaymentDate: Date
    if (paymentDate) {
      nextPaymentDate = new Date(paymentDate)
    } else {
      nextPaymentDate = new Date(installment.startDate)
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + installment.currentPaid)
      nextPaymentDate.setDate(installment.paymentDay)
      
      // Ajustar se o dia não existe no mês
      const daysInMonth = new Date(nextPaymentDate.getFullYear(), nextPaymentDate.getMonth() + 1, 0).getDate()
      if (installment.paymentDay > daysInMonth) {
        nextPaymentDate.setDate(daysInMonth)
      }
    }

    // Criar transação para esta parcela
    const installmentNumber = installment.currentPaid + 1
    const transaction = await createInstallmentTransaction(
      installment,
      installmentNumber,
      nextPaymentDate
    )

    installment.currentPaid += 1

    // Se pagou todas as parcelas, marcar como completo
    if (installment.currentPaid >= installment.installments) {
      installment.status = 'completed'
    }

    await installment.save()

    res.json({
      installment,
      transaction,
      message: `Parcela ${installmentNumber}/${installment.installments} marcada como paga`
    })
  } catch (error) {
    console.error('Erro ao marcar parcela como paga:', error)
    res.status(500).json({ error: 'Erro ao marcar parcela como paga' })
  }
})

// @route   PUT /api/installments/:id/mark-paid
// @desc    Marcar múltiplas parcelas como pagas (útil para ajustes manuais)
// @access  Private
router.put('/:id/mark-paid', authenticateToken, async (req, res) => {
  try {
    const { paidCount } = req.body // Número de parcelas a marcar como pagas

    if (!paidCount || paidCount < 0) {
      return res.status(400).json({ error: 'Número de parcelas pagas é obrigatório' })
    }

    const installment = await Installment.findOne({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!installment) {
      return res.status(404).json({ error: 'Parcelamento não encontrado' })
    }

    const newPaidCount = Math.min(Math.max(0, parseInt(paidCount)), installment.installments)
    
    // Se já tem mais parcelas pagas, não fazer nada
    if (newPaidCount <= installment.currentPaid) {
      return res.status(400).json({ 
        error: `Já existem ${installment.currentPaid} parcelas pagas. Use um número maior.` 
      })
    }

    // Criar transações para as parcelas que ainda não foram pagas
    const createdTransactions = []
    for (let i = installment.currentPaid + 1; i <= newPaidCount; i++) {
      const paymentDate = new Date(installment.startDate)
      paymentDate.setMonth(paymentDate.getMonth() + (i - 1))
      paymentDate.setDate(installment.paymentDay)
      
      // Ajustar se o dia não existe no mês
      const daysInMonth = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, 0).getDate()
      if (installment.paymentDay > daysInMonth) {
        paymentDate.setDate(daysInMonth)
      }

      const transaction = await createInstallmentTransaction(
        installment,
        i,
        paymentDate
      )
      createdTransactions.push(transaction)
    }

    installment.currentPaid = newPaidCount

    // Se pagou todas as parcelas, marcar como completo
    if (installment.currentPaid >= installment.installments) {
      installment.status = 'completed'
    }

    await installment.save()

    res.json({
      installment,
      createdTransactions: createdTransactions.length,
      message: `${createdTransactions.length} parcela(s) marcada(s) como paga(s)`
    })
  } catch (error) {
    console.error('Erro ao marcar parcelas como pagas:', error)
    res.status(500).json({ error: 'Erro ao marcar parcelas como pagas' })
  }
})

// @route   PUT /api/installments/:id/cancel
// @desc    Cancelar parcelamento
// @access  Private
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const installment = await Installment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { status: 'cancelled' },
      { new: true }
    )

    if (!installment) {
      return res.status(404).json({ error: 'Parcelamento não encontrado' })
    }

    res.json(installment)
  } catch (error) {
    console.error('Erro ao cancelar parcelamento:', error)
    res.status(500).json({ error: 'Erro ao cancelar parcelamento' })
  }
})

// @route   DELETE /api/installments/:id
// @desc    Deletar parcelamento
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const installment = await Installment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user!._id
    })

    if (!installment) {
      return res.status(404).json({ error: 'Parcelamento não encontrado' })
    }

    res.json({ message: 'Parcelamento deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar parcelamento:', error)
    res.status(500).json({ error: 'Erro ao deletar parcelamento' })
  }
})

export default router

