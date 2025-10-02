import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Erro interno do servidor'

  // Log do erro para debugging
  console.error('Erro capturado:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Erros do MongoDB
  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    const errors = Object.values(error.errors).map((err: any) => err.message)
    message = errors.join(', ')
  }

  if (error instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = 'ID inválido'
  }

  if ((error as any).code === 11000) {
    statusCode = 400
    const field = Object.keys((error as any).keyValue)[0]
    message = `${field} já está em uso`
  }

  // Erros de JSON malformado
  if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400
    message = 'JSON malformado'
  }

  // Erros de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Token inválido'
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expirado'
  }

  // Resposta de erro
  const errorResponse = {
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  }

  res.status(statusCode).json(errorResponse)
}

// Middleware para capturar rotas não encontradas
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = new Error(`Rota não encontrada: ${req.originalUrl}`) as AppError
  error.statusCode = 404
  next(error)
}

// Função para criar erros customizados
export const createError = (message: string, statusCode: number = 500) => {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.isOperational = true
  return error
}
