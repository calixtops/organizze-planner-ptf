import React from 'react'

// Tipos para validação
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface ValidationErrors {
  [key: string]: string
}

// Função principal de validação
export function validate(data: any, rules: ValidationRules): ValidationErrors {
  const errors: ValidationErrors = {}

  for (const field in rules) {
    const value = data[field]
    const rule = rules[field]
    const error = validateField(value, rule, field)
    
    if (error) {
      errors[field] = error
    }
  }

  return errors
}

// Validação de campo individual
function validateField(value: any, rule: ValidationRule, fieldName: string): string | null {
  // Required
  if (rule.required && (value === undefined || value === null || value === '')) {
    return `${getFieldLabel(fieldName)} é obrigatório`
  }

  // Se o campo não é obrigatório e está vazio, não valida as outras regras
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return null
  }

  // Min length
  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    return `${getFieldLabel(fieldName)} deve ter pelo menos ${rule.minLength} caracteres`
  }

  // Max length
  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    return `${getFieldLabel(fieldName)} deve ter no máximo ${rule.maxLength} caracteres`
  }

  // Min value
  if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
    return `${getFieldLabel(fieldName)} deve ser maior ou igual a ${rule.min}`
  }

  // Max value
  if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
    return `${getFieldLabel(fieldName)} deve ser menor ou igual a ${rule.max}`
  }

  // Pattern
  if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
    return `${getFieldLabel(fieldName)} tem formato inválido`
  }

  // Custom validation
  if (rule.custom) {
    const customError = rule.custom(value)
    if (customError) {
      return customError
    }
  }

  return null
}

// Labels dos campos em português
function getFieldLabel(fieldName: string): string {
  const labels: { [key: string]: string } = {
    name: 'Nome',
    username: 'Nome de usuário',
    password: 'Senha',
    confirmPassword: 'Confirmação de senha',
    email: 'E-mail',
    description: 'Descrição',
    amount: 'Valor',
    category: 'Categoria',
    date: 'Data',
    type: 'Tipo',
    status: 'Status',
    accountName: 'Nome da conta',
    accountType: 'Tipo da conta',
    bank: 'Banco',
    balance: 'Saldo',
    cardName: 'Nome do cartão',
    limit: 'Limite',
    closingDay: 'Dia de fechamento'
  }

  return labels[fieldName] || fieldName
}

// Regras de validação predefinidas
export const validationRules = {
  // Autenticação
  register: {
    name: { required: true, minLength: 2, maxLength: 100 },
    username: { 
      required: true, 
      minLength: 3, 
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_]+$/
    },
    password: { required: true, minLength: 6, maxLength: 100 },
    confirmPassword: { required: true, minLength: 6, maxLength: 100 }
  },
  
  login: {
    username: { required: true, minLength: 3, maxLength: 50 },
    password: { required: true, minLength: 6, maxLength: 100 }
  },

  // Transações
  transaction: {
    description: { required: true, minLength: 1, maxLength: 200 },
    amount: { 
      required: true, 
      min: 0.01,
      custom: (value: number) => {
        if (isNaN(value) || !isFinite(value)) {
          return 'Valor deve ser um número válido'
        }
        return null
      }
    },
    category: { required: true, minLength: 1, maxLength: 50 },
    date: { required: true },
    type: { 
      required: true,
      custom: (value: string) => {
        if (!['income', 'expense'].includes(value)) {
          return 'Tipo deve ser "Receita" ou "Despesa"'
        }
        return null
      }
    },
    status: {
      custom: (value: string) => {
        if (value && !['paid', 'pending'].includes(value)) {
          return 'Status deve ser "Pago" ou "Pendente"'
        }
        return null
      }
    }
  },

  // Contas
  account: {
    name: { required: true, minLength: 1, maxLength: 100 },
    type: { 
      required: true,
      custom: (value: string) => {
        if (!['checking', 'savings', 'investment', 'credit'].includes(value)) {
          return 'Tipo de conta inválido'
        }
        return null
      }
    },
    balance: { 
      min: 0,
      custom: (value: number) => {
        if (value !== undefined && (isNaN(value) || !isFinite(value))) {
          return 'Saldo deve ser um número válido'
        }
        return null
      }
    },
    bank: { maxLength: 100 }
  },

  // Cartões de crédito
  creditCard: {
    name: { required: true, minLength: 1, maxLength: 100 },
    bank: { required: true, minLength: 1, maxLength: 100 },
    limit: { 
      required: true, 
      min: 0.01,
      custom: (value: number) => {
        if (isNaN(value) || !isFinite(value)) {
          return 'Limite deve ser um número válido'
        }
        return null
      }
    },
    currentBalance: { 
      min: 0,
      custom: (value: number) => {
        if (value !== undefined && (isNaN(value) || !isFinite(value))) {
          return 'Saldo atual deve ser um número válido'
        }
        return null
      }
    },
    closingDay: { 
      required: true,
      min: 1,
      max: 31,
      custom: (value: number) => {
        if (isNaN(value) || !Number.isInteger(value)) {
          return 'Dia de fechamento deve ser um número inteiro'
        }
        return null
      }
    }
  }
}

// Validação de confirmação de senha
export function validatePasswordConfirmation(password: string, confirmPassword: string): string | null {
  if (password !== confirmPassword) {
    return 'As senhas não coincidem'
  }
  return null
}

// Validação de data
export function validateDate(date: string | Date): string | null {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Data inválida'
  }

  const today = new Date()
  today.setHours(23, 59, 59, 999) // Fim do dia de hoje
  
  if (dateObj > today) {
    return 'Data não pode ser futura'
  }

  return null
}

// Validação de valor monetário
export function validateCurrency(value: string | number): string | null {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue) || !isFinite(numValue)) {
    return 'Valor deve ser um número válido'
  }

  if (numValue <= 0) {
    return 'Valor deve ser maior que zero'
  }

  if (numValue > 999999999) {
    return 'Valor muito alto'
  }

  return null
}

// Hook para validação em tempo real
export function useValidation<T>(initialData: T, rules: ValidationRules) {
  const [data, setData] = React.useState<T>(initialData)
  const [errors, setErrors] = React.useState<ValidationErrors>({})
  const [touched, setTouched] = React.useState<{ [key: string]: boolean }>({})

  const validateField = React.useCallback((field: string, value: any): string | null => {
    const fieldRules = rules[field]
    if (!fieldRules) return null
    
    const errors = validate(value, { [field]: fieldRules })
    return errors[field] || null
  }, [rules])

  const validateAll = React.useCallback(() => {
    const newErrors = validate(data, rules)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [data, rules])

  const setFieldValue = React.useCallback((field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    
    // Validação em tempo real após o campo ser tocado
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error || '' }))
    }
  }, [touched, validateField])

  const setFieldTouched = React.useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validar campo quando for tocado
    const error = validateField(field, (data as any)[field])
    setErrors(prev => ({ ...prev, [field]: error || '' }))
  }, [data, validateField])

  const reset = React.useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouched({})
  }, [initialData])

  const isValid = Object.keys(errors).length === 0

  return {
    data,
    errors,
    touched,
    isValid,
    setFieldValue,
    setFieldTouched,
    validateAll,
    reset
  }
}
