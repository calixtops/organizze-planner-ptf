import type { Request, Response, NextFunction } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import { createError } from './errorHandler.js'

// Middleware para processar resultados da validação
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): any => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg)
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errorMessages
    })
  }
  
  next()
}

// Validações para autenticação
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Nome de usuário deve ter entre 3 e 20 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Nome de usuário deve conter apenas letras, números e underscore'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  
  handleValidationErrors
]

export const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Nome de usuário é obrigatório'),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  
  handleValidationErrors
]

// Validações para contas
export const validateAccount = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome da conta deve ter entre 1 e 100 caracteres'),
  
  body('type')
    .isIn(['checking', 'savings', 'investment', 'credit'])
    .withMessage('Tipo de conta deve ser: checking, savings, investment ou credit'),
  
  body('balance')
    .isFloat({ min: 0 })
    .withMessage('Saldo deve ser um número positivo ou zero'),
  
  body('bank')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Nome do banco não pode ter mais de 100 caracteres'),
  
  handleValidationErrors
]

export const validateAccountId = [
  param('id')
    .isMongoId()
    .withMessage('ID da conta inválido'),
  
  handleValidationErrors
]

// Validações para cartões de crédito
export const validateCreditCard = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome do cartão deve ter entre 1 e 100 caracteres'),
  
  body('bank')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome do banco deve ter entre 1 e 100 caracteres'),
  
  body('limit')
    .isFloat({ min: 0 })
    .withMessage('Limite deve ser um número positivo ou zero'),
  
  body('currentBalance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Saldo atual deve ser um número positivo ou zero'),
  
  body('closingDay')
    .isInt({ min: 1, max: 31 })
    .withMessage('Dia de fechamento deve ser entre 1 e 31'),
  
  body('dueDay')
    .isInt({ min: 1, max: 31 })
    .withMessage('Dia de vencimento deve ser entre 1 e 31'),
  
  handleValidationErrors
]

export const validateCreditCardId = [
  param('id')
    .isMongoId()
    .withMessage('ID do cartão inválido'),
  
  handleValidationErrors
]

// Validações para transações
export const validateTransaction = [
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Descrição deve ter entre 1 e 200 caracteres'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser um número positivo maior que zero'),
  
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Tipo deve ser: income ou expense'),
  
  body('nature')
    .optional()
    .isIn(['fixed', 'variable'])
    .withMessage('Natureza deve ser: fixed ou variable'),
  
  body('category')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Categoria deve ter entre 1 e 50 caracteres'),
  
  body('status')
    .optional()
    .isIn(['paid', 'pending'])
    .withMessage('Status deve ser: paid ou pending'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Data deve estar no formato ISO 8601'),
  
  body('accountId')
    .optional()
    .isMongoId()
    .withMessage('ID da conta inválido'),
  
  body('creditCardId')
    .optional()
    .isMongoId()
    .withMessage('ID do cartão inválido'),
  
  body('groupId')
    .optional()
    .isMongoId()
    .withMessage('ID do grupo inválido'),
  
  // Validação customizada para garantir que pelo menos uma conta está associada
  body().custom((body) => {
    if (!body.accountId && !body.creditCardId) {
      throw new Error('Transação deve estar associada a uma conta ou cartão de crédito')
    }
    return true
  }),
  
  handleValidationErrors
]

export const validateTransactionId = [
  param('id')
    .isMongoId()
    .withMessage('ID da transação inválido'),
  
  handleValidationErrors
]

// Validações para parâmetros de query
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  
  handleValidationErrors
]

export const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data de início deve estar no formato ISO 8601'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data de fim deve estar no formato ISO 8601'),
  
  handleValidationErrors
]

// Validações para grupos
export const validateGroupCreate = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do grupo deve ter entre 2 e 100 caracteres'),
  handleValidationErrors
]

export const validateGroupId = [
  param('id')
    .isMongoId()
    .withMessage('ID do grupo inválido'),
  handleValidationErrors
]

export const validateMemberAdd = [
  param('id')
    .isMongoId()
    .withMessage('ID do grupo inválido'),
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Nome de usuário deve ter entre 3 e 20 caracteres'),
  body('role')
    .optional()
    .isIn(['owner', 'member'])
    .withMessage('Papel deve ser owner ou member'),
  handleValidationErrors
]

// Validação para sugestão de IA
export const validateAISuggestion = [
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Descrição deve ter entre 1 e 200 caracteres'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser um número positivo maior que zero'),
  
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Tipo deve ser: income ou expense'),
  
  handleValidationErrors
]
