import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import accountRoutes from './routes/accounts.js'
import creditCardRoutes from './routes/creditCards.js'
import transactionRoutes from './routes/transactions-hybrid.js'
import aiRoutes from './routes/ai.js'
import groupRoutes from './routes/groups.js'
import installmentRoutes from './routes/installments.js'
import familyMemberRoutes from './routes/familyMembers.js'
import recurringExpenseRoutes from './routes/recurringExpenses.js'
import createAdmin from './scripts/createAdmin.js'

// Carregar variáveis de ambiente
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar .env da pasta server
const envPath = join(__dirname, '..', '.env')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn('⚠️  Arquivo .env não encontrado na pasta server')
} else {
  console.log('✅ Variáveis de ambiente carregadas')
  if (process.env.GEMINI_API_KEY) {
    console.log('✅ GEMINI_API_KEY encontrada')
  } else {
    console.warn('⚠️  GEMINI_API_KEY não encontrada no .env')
  }
}

const app = express()
const PORT = process.env.PORT || 5000

// Rate limiting (desabilitado em desenvolvimento)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 10000, // 10000 em dev, 100 em prod
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
  } : false, // Desabilitar CSP em dev
}))

app.use(compression())
app.use(limiter)

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN ? 
  [...process.env.CORS_ORIGIN.split(','), 'http://localhost:3000', 'http://localhost:3001'] : 
  ['http://localhost:3000', 'http://localhost:3001']

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.warn(`⚠️  Origem bloqueada por CORS: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Conectar ao MongoDB (opcional para desenvolvimento)
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI não definida - usando modo desenvolvimento')
      return false
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB || 'planner'
    })
    
    console.log('✅ Conectado ao MongoDB com sucesso')
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error)
    console.log('⚠️  Continuando em modo desenvolvimento sem MongoDB')
    return false
  }
}

// Conectar ao banco de dados
connectDB().then(async (isConnected) => {
  // Criar usuário admin se não existir (apenas se MongoDB estiver conectado)
  if (isConnected && process.env.NODE_ENV === 'development') {
    await createAdmin()
  }
})

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
app.use('/api/users', authRoutes) // Rota de usuários usa o mesmo router
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
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.originalUrl 
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 URL: http://localhost:${PORT}`)
})

export default app
