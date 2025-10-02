import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import { errorHandler } from '../src/middleware/errorHandler.js'
import authRoutes from '../src/routes/auth.js'
import accountRoutes from '../src/routes/accounts.js'
import creditCardRoutes from '../src/routes/creditCards.js'
import transactionRoutes from '../src/routes/transactions.js'
import aiRoutes from '../src/routes/ai.js'

const app = express()

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: 'Muitas tentativas de acesso. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

app.use(compression())
app.use(limiter)

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não definida nas variáveis de ambiente')
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'planner'
    })
    
    console.log('✅ Conectado ao MongoDB com sucesso')
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error)
    throw error
  }
}

// Conectar ao banco de dados
connectDB()

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/credit-cards', creditCardRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/ai', aiRoutes)

// Middleware de tratamento de erros
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.originalUrl 
  })
})

export default app
