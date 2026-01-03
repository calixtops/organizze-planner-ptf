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

    console.log(`🔐 Auth request: ${req.method} ${req.path}`)

    if (!token) {
      console.warn('❌ Token ausente')
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
    console.log('✅ Token válido, userId:', decoded.userId)

    // Validar se o userId é um ObjectId válido do MongoDB
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      console.warn('❌ Token inválido - formato de ID incorreto')
      return res.status(401).json({ 
        error: 'Token inválido - formato de ID incorreto' 
      })
    }

    // Verificar se parece um ObjectId válido (24 caracteres hexadecimais)
    if (!/^[0-9a-fA-F]{24}$/.test(decoded.userId)) {
      console.warn('❌ Token inválido - ID de usuário inválido:', decoded.userId)
      return res.status(401).json({ 
        error: 'Token inválido - ID de usuário inválido. Faça login novamente.' 
      })
    }

    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      console.warn('❌ Usuário não encontrado:', decoded.userId)
      return res.status(401).json({ 
        error: 'Token inválido - usuário não encontrado' 
      })
    }

    console.log('✅ Usuário autenticado:', user.username)

    // Adicionar informações do usuário à requisição
    req.user = {
      _id: user._id.toString(),
      username: user.username,
      name: user.name
    }

    next()
  } catch (error: any) {
    console.error('❌ Erro na autenticação:', error.message)
    
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
