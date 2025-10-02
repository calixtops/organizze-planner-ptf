import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Estender a interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string
        username: string
        name: string
      }
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de acesso requerido' 
      })
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não definido nas variáveis de ambiente')
      return res.status(500).json({ 
        error: 'Erro interno do servidor' 
      })
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any

    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Token inválido - usuário não encontrado' 
      })
    }

    // Adicionar informações do usuário à requisição
    req.user = {
      _id: user._id.toString(),
      username: user.username,
      name: user.name
    }

    next()
  } catch (error: any) {
    console.error('Erro na autenticação:', error.message)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido' 
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado' 
      })
    }
    
    return res.status(500).json({ 
      error: 'Erro interno do servidor' 
    })
  }
}

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return next() // Continuar sem autenticação
    }

    if (!process.env.JWT_SECRET) {
      return next() // Continuar sem autenticação se JWT_SECRET não estiver definido
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    const user = await User.findById(decoded.userId).select('-password')
    
    if (user) {
      req.user = {
        _id: user._id.toString(),
        username: user.username,
        name: user.name
      }
    }

    next()
  } catch (error) {
    // Em caso de erro, continuar sem autenticação
    next()
  }
}
