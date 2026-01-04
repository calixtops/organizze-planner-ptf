// Serverless function handler para Vercel
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'

const app = express()

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas tentativas de acesso. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
})

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  } : false,
}))

app.use(compression())
app.use(limiter)

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN ? 
  [...process.env.CORS_ORIGIN.split(','), 'http://localhost:3000', 'http://localhost:3001'] : 
  ['http://localhost:3000', 'http://localhost:3001']

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Gerenciar conexão MongoDB para serverless (connection pooling)
let cachedDb: typeof mongoose | null = null

const connectDB = async () => {
  // Se já existe conexão ativa, reutilizar
  if (cachedDb && mongoose.connection.readyState === 1) {
    console.log('✅ Reutilizando conexão MongoDB existente')
    return cachedDb
  }

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não definida nas variáveis de ambiente')
    }

    console.log('🔄 Conectando ao MongoDB...')
    
    // Opções otimizadas para serverless functions
    const options = {
      dbName: process.env.MONGODB_DB || 'planner',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    cachedDb = await mongoose.connect(process.env.MONGODB_URI, options)
    
    console.log('✅ Conectado ao MongoDB com sucesso')
    return cachedDb
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error)
    cachedDb = null
    throw error
  }
}

// Middleware para garantir conexão antes de processar requisições
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB()
    next()
  } catch (error) {
    console.error('Erro na conexão MongoDB:', error)
    res.status(500).json({ 
      error: 'Erro ao conectar ao banco de dados',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Erro interno do servidor'
    })
  }
})

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  })
})

// Importar rotas usando imports estáticos
// O Vercel compila TypeScript automaticamente
import authRoutes from '../server/src/routes/auth.js'
import accountRoutes from '../server/src/routes/accounts.js'
import creditCardRoutes from '../server/src/routes/creditCards.js'
import transactionRoutes from '../server/src/routes/transactions-hybrid.js'
import groupRoutes from '../server/src/routes/groups.js'
import installmentRoutes from '../server/src/routes/installments.js'
import familyMemberRoutes from '../server/src/routes/familyMembers.js'
import recurringExpenseRoutes from '../server/src/routes/recurringExpenses.js'
import aiRoutes from '../server/src/routes/ai.js'
import { errorHandler } from '../server/src/middleware/errorHandler.js'

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', authRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/credit-cards', creditCardRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/installments', installmentRoutes)
app.use('/api/family-members', familyMemberRoutes)
app.use('/api/recurring-expenses', recurringExpenseRoutes)
app.use('/api/ai', aiRoutes)

// Middleware de tratamento de erros
app.use(errorHandler)

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.originalUrl 
  })
})

export default app
