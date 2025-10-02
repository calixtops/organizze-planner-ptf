import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { validateAISuggestion } from '../middleware/validation.js'
import { suggestTransactionCategory, learnFromFeedback } from '../services/aiService.js'

const router = express.Router()

// @route   POST /api/ai/suggest-category
// @desc    Sugerir categoria para uma transação usando IA
// @access  Private
router.post('/suggest-category', authenticateToken, validateAISuggestion, async (req, res, next) => {
  try {
    const { description, amount, type } = req.body

    const suggestion = await suggestTransactionCategory(
      req.user!._id,
      description,
      amount,
      type
    )

    res.json({
      suggestion
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   POST /api/ai/feedback
// @desc    Enviar feedback sobre sugestão de categoria
// @access  Private
router.post('/feedback', authenticateToken, async (req, res, next) => {
  try {
    const { originalSuggestion, userChoice, description } = req.body

    if (!originalSuggestion || !userChoice || !description) {
      return res.status(400).json({
        error: 'Sugestão original, escolha do usuário e descrição são obrigatórios'
      })
    }

    await learnFromFeedback(
      req.user!._id,
      originalSuggestion,
      userChoice,
      description
    )

    res.json({
      message: 'Feedback registrado com sucesso'
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   GET /api/ai/categories
// @desc    Obter categorias disponíveis
// @access  Private
router.get('/categories', authenticateToken, async (req, res, next) => {
  try {
    const categories = {
      income: [
        'Salário',
        'Freelance',
        'Investimentos',
        'Vendas',
        'Bônus',
        'Outros'
      ],
      expense: [
        'Alimentação',
        'Transporte',
        'Moradia',
        'Saúde',
        'Educação',
        'Lazer',
        'Compras',
        'Serviços',
        'Assinaturas',
        'Outros'
      ]
    }

    res.json(categories)
  } catch (error: any) {
    next(error)
  }
})

export default router
