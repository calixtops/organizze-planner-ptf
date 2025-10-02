import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { authenticateToken } from '../middleware/auth.js'
import { validateRegister, validateLogin } from '../middleware/validation.js'
import { createError } from '../middleware/errorHandler.js'

const router = express.Router()

// Função para gerar token JWT
const generateToken = (userId: string): string => {
  if (!process.env.JWT_SECRET) {
    throw createError('JWT_SECRET não configurado', 500)
  }
  
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  )
}

// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Public
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { name, username, password } = req.body

    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ username })
    if (existingUser) {
      return res.status(400).json({
        error: 'Nome de usuário já existe'
      })
    }

    // Criar novo usuário
    const user = new User({
      name,
      username,
      password
    })

    await user.save()

    // Gerar token
    const token = generateToken(user._id.toString())

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        createdAt: user.createdAt
      }
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   POST /api/auth/login
// @desc    Fazer login do usuário
// @access  Public
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { username, password } = req.body

    // Buscar usuário e incluir senha para comparação
    const user = await User.findOne({ username }).select('+password')
    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      })
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      })
    }

    // Gerar token
    const token = generateToken(user._id.toString())

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        createdAt: user.createdAt
      }
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   GET /api/auth/me
// @desc    Obter dados do usuário autenticado
// @access  Private
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!._id).select('-password')
    
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      })
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   PUT /api/auth/profile
// @desc    Atualizar perfil do usuário
// @access  Private
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { name, email } = req.body
    const updates: any = {}

    if (name) {
      updates.name = name.trim()
    }

    if (email) {
      // Verificar se o novo email já está em uso por outro usuário
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.user!._id } 
      })
      
      if (existingUser) {
        return res.status(400).json({
          error: 'Email já está em uso por outro usuário'
        })
      }
      
      updates.email = email.toLowerCase()
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Nenhum campo para atualizar'
      })
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      })
    }

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt
      }
    })
  } catch (error: any) {
    next(error)
  }
})

// @route   POST /api/auth/change-password
// @desc    Alterar senha do usuário
// @access  Private
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Senha atual e nova senha são obrigatórias'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Nova senha deve ter pelo menos 6 caracteres'
      })
    }

    // Buscar usuário com senha
    const user = await User.findById(req.user!._id).select('+password')
    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado'
      })
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: 'Senha atual incorreta'
      })
    }

    // Atualizar senha
    user.password = newPassword
    await user.save()

    res.json({
      message: 'Senha alterada com sucesso'
    })
  } catch (error: any) {
    next(error)
  }
})

export default router
