import express from 'express'
import jwt from 'jsonwebtoken'

const router = express.Router()

// @route   POST /api/auth/login
// @desc    Login do usuário (mock)
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username e password são obrigatórios'
      })
    }

    // Login mock - aceita qualquer credencial
    const mockUser = {
      _id: 'mock-user-id-' + Date.now(),
      name: 'Usuário Demo',
      username: username,
      email: `${username}@demo.com`,
      createdAt: new Date().toISOString()
    }

    const token = jwt.sign(
      { userId: mockUser._id },
      (process.env.JWT_SECRET || 'mock-secret') as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      success: true,
      message: 'Login realizado com sucesso (modo desenvolvimento)',
      token,
      user: mockUser
    })
  } catch (error) {
    console.error('Erro no login mock:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

// @route   POST /api/auth/register
// @desc    Registro de usuário (mock)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, username, password } = req.body

    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome, username e password são obrigatórios'
      })
    }

    // Registro mock
    const mockUser = {
      _id: 'mock-user-id-' + Date.now(),
      name: name,
      username: username,
      email: `${username}@demo.com`,
      createdAt: new Date().toISOString()
    }

    const token = jwt.sign(
      { userId: mockUser._id },
      (process.env.JWT_SECRET || 'mock-secret') as jwt.Secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso (modo desenvolvimento)',
      token,
      user: mockUser
    })
  } catch (error) {
    console.error('Erro no registro mock:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

// @route   GET /api/auth/me
// @desc    Obter dados do usuário atual (mock)
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      })
    }

    const token = authHeader.substring(7)
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mock-secret') as any
      
      // Usuário mock baseado no token
      const mockUser = {
        _id: decoded.userId || 'mock-user-id',
        name: 'Usuário Demo',
        username: 'demo',
        email: 'demo@demo.com',
        createdAt: new Date().toISOString()
      }

      res.json(mockUser)
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      })
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    })
  }
})

export default router
