import express from 'express'
import Transaction from '../models/Transaction.js'
import Account from '../models/Account.js'
import CreditCard from '../models/CreditCard.js'
import { authenticateToken } from '../middleware/auth.js'
import mongoose from 'mongoose'

const router = express.Router()

// Verificar se MongoDB está conectado
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1
}

// @route   POST /api/transactions
// @desc    Criar nova transação
// @access  Private
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const transactionData = {
      ...req.body,
      userId: req.user!._id
    }

    if (isMongoConnected()) {
      // Salvar no MongoDB
      const transaction = new Transaction(transactionData)
      const savedTransaction = await transaction.save()
      
      res.status(201).json({
        success: true,
        message: 'Transação salva com sucesso no banco de dados!',
        transaction: savedTransaction
      })
    } else {
      // Fallback: retornar sucesso mas avisar que está em modo desenvolvimento
      const mockTransaction = {
        ...transactionData,
        _id: 'mock-transaction-' + Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      console.log('💾 Transação salva em modo desenvolvimento:', mockTransaction.description)
      
      res.status(201).json({
        success: true,
        message: 'Transação salva em modo desenvolvimento (MongoDB não conectado)',
        transaction: mockTransaction,
        warning: 'Dados não persistem entre reinicializações do servidor'
      })
    }
  } catch (error) {
    console.error('Erro ao salvar transação:', error)
    next(error)
  }
})

// @route   GET /api/transactions
// @desc    Listar transações do usuário
// @access  Private
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      // Buscar no MongoDB
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const skip = (page - 1) * limit
      
      const filters: any = { userId: req.user!._id }
      
      if (req.query.type) filters.type = req.query.type
      if (req.query.category) filters.category = new RegExp(req.query.category as string, 'i')
      if (req.query.status) filters.status = req.query.status
      
      const transactions = await Transaction.find(filters)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
      
      const total = await Transaction.countDocuments(filters)
      
      res.json({
        transactions,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      })
    } else {
      // Fallback: retornar array vazio
      res.json({
        transactions: [],
        total: 0,
        page: 1,
        limit: 20,
        pages: 0,
        message: 'MongoDB não conectado - retornando dados vazios'
      })
    }
  } catch (error) {
    console.error('Erro ao buscar transações:', error)
    next(error)
  }
})

// @route   GET /api/transactions/summary/dashboard
// @desc    Obter resumo para dashboard
// @access  Private
router.get('/summary/dashboard', authenticateToken, async (req, res, next) => {
  try {
    if (isMongoConnected()) {
      // Buscar dados reais do MongoDB
      const summary = await Transaction.getDashboardSummary(req.user!._id)
      res.json(summary)
    } else {
      // Fallback: dados mock
      const mockSummary = {
        totalBalance: 2500.50,
        monthlyIncome: 3500.00,
        monthlyExpenses: 2800.75,
        monthlyTrends: {
          income: [
            { month: 'Janeiro', amount: 3500.00 },
            { month: 'Fevereiro', amount: 3500.00 },
            { month: 'Março', amount: 3500.00 }
          ],
          expenses: [
            { month: 'Janeiro', amount: 2800.75 },
            { month: 'Fevereiro', amount: 2650.50 },
            { month: 'Março', amount: 2900.00 }
          ]
        },
        categoriesBreakdown: {
          expenses: [
            { _id: 'Alimentação', total: 1200.50 },
            { _id: 'Transporte', total: 450.25 },
            { _id: 'Moradia', total: 800.00 },
            { _id: 'Saúde', total: 200.00 },
            { _id: 'Educação', total: 150.00 }
          ],
          income: [
            { _id: 'Salário', total: 3500.00 }
          ]
        },
        message: 'Dados mock - MongoDB não conectado'
      }
      
      res.json(mockSummary)
    }
  } catch (error) {
    console.error('Erro ao buscar resumo:', error)
    next(error)
  }
})

// @route   PUT /api/transactions/:id
// @desc    Atualizar transação
// @access  Private
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (isMongoConnected()) {
      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId: req.user!._id },
        req.body,
        { new: true, runValidators: true }
      )
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transação não encontrada'
        })
      }
      
      res.json({
        success: true,
        message: 'Transação atualizada com sucesso',
        transaction
      })
    } else {
      // Fallback: simular sucesso
      res.json({
        success: true,
        message: 'Transação atualizada em modo desenvolvimento',
        transaction: {
          ...req.body,
          _id: id,
          userId: req.user!._id,
          updatedAt: new Date().toISOString()
        },
        warning: 'MongoDB não conectado'
      })
    }
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)
    next(error)
  }
})

// @route   DELETE /api/transactions/:id
// @desc    Deletar transação
// @access  Private
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params
    
    if (isMongoConnected()) {
      const transaction = await Transaction.findOneAndDelete({
        _id: id,
        userId: req.user!._id
      })
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transação não encontrada'
        })
      }
      
      res.json({
        success: true,
        message: 'Transação deletada com sucesso'
      })
    } else {
      // Fallback: simular sucesso
      res.json({
        success: true,
        message: 'Transação deletada em modo desenvolvimento',
        warning: 'MongoDB não conectado'
      })
    }
  } catch (error) {
    console.error('Erro ao deletar transação:', error)
    next(error)
  }
})

export default router
