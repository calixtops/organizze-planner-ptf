import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 5000

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}))

app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor Mock funcionando!'
  })
})

// Mock auth endpoints
app.post('/api/auth/login', (req, res) => {
  console.log('Login mock:', req.body)
  res.json({
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      _id: 'mock-user-id',
      name: 'Usuário Demo',
      username: req.body.username,
      email: `${req.body.username}@demo.com`,
      createdAt: new Date().toISOString()
    }
  })
})

app.post('/api/auth/register', (req, res) => {
  console.log('Register mock:', req.body)
  res.json({
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      _id: 'mock-user-id',
      name: req.body.name,
      username: req.body.username,
      email: `${req.body.username}@demo.com`,
      createdAt: new Date().toISOString()
    }
  })
})

app.get('/api/auth/me', (req, res) => {
  console.log('Get user mock')
  res.json({
    _id: 'mock-user-id',
    name: 'Usuário Demo',
    username: 'demo',
    email: 'demo@demo.com',
    createdAt: new Date().toISOString()
  })
})

// Mock transactions endpoints
app.post('/api/transactions', (req, res) => {
  console.log('Recebida transação:', req.body)
  res.json({ 
    success: true, 
    message: 'Transação salva com sucesso!',
    transaction: {
      ...req.body,
      _id: 'mock-transaction-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })
})

app.get('/api/transactions/summary/dashboard', (req, res) => {
  res.json({
    totalBalance: 2500.50,
    monthlyIncome: 3500.00,
    monthlyExpenses: 2800.75,
    categoriesBreakdown: {
      expenses: [
        { _id: 'Alimentação', total: 1200.50 },
        { _id: 'Transporte', total: 450.25 },
        { _id: 'Moradia', total: 800.00 },
        { _id: 'Saúde', total: 200.00 },
        { _id: 'Educação', total: 150.00 }
      ],
      income: [
        { _id: 'Salário', total: 3500.00 }
      ]
    }
  })
})

app.get('/api/transactions', (req, res) => {
  res.json({
    transactions: [],
    total: 0,
    page: 1,
    limit: 10
  })
})

// Mock accounts endpoints
app.get('/api/accounts', (req, res) => {
  res.json([])
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor Mock rodando na porta ${PORT}`)
  console.log(`🔗 URL: http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🔐 Auth endpoints: /api/auth/login, /api/auth/register, /api/auth/me`)
  console.log(`💰 Transaction endpoints: /api/transactions`)
})
