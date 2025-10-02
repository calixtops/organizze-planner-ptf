import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 5000

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}))

app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'development'
  })
})

// Rota de login simples para teste
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  
  console.log('Login attempt:', { username, password })
  
  if (username === 'admin' && password === 'admin') {
    res.json({
      message: 'Login realizado com sucesso',
      token: 'fake-jwt-token-for-testing',
      user: {
        _id: '1',
        name: 'Administrador',
        username: 'admin',
        createdAt: new Date().toISOString()
      }
    })
  } else {
    res.status(401).json({
      error: 'Credenciais inválidas'
    })
  }
})

// Middleware simples de autenticação (só para teste)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  // Para teste, aceita qualquer token
  next()
}

// Rota para obter dados do usuário autenticado
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    _id: '1',
    name: 'Administrador',
    username: 'admin',
    createdAt: new Date().toISOString()
  })
})

// Rota para dados do dashboard
app.get('/api/dashboard', authenticateToken, (req, res) => {
  // Dados mock para o dashboard
  const dashboardData = {
    totalBalance: 15000.50,
    monthlyBalance: 2500.75,
    categoriesBreakdown: {
      expenses: [
        { category: 'Alimentação', amount: 800.00, percentage: 32 },
        { category: 'Transporte', amount: 400.00, percentage: 16 },
        { category: 'Lazer', amount: 300.00, percentage: 12 },
        { category: 'Saúde', amount: 200.00, percentage: 8 },
        { category: 'Outros', amount: 800.75, percentage: 32 }
      ],
      income: [
        { category: 'Salário', amount: 5000.00, percentage: 80 },
        { category: 'Freelance', amount: 800.00, percentage: 13 },
        { category: 'Investimentos', amount: 450.00, percentage: 7 }
      ]
    },
    recentTransactions: [
      {
        _id: '1',
        description: 'Supermercado Extra',
        amount: 150.00,
        type: 'expense',
        category: 'Alimentação',
        date: new Date().toISOString(),
        status: 'completed'
      },
      {
        _id: '2',
        description: 'Uber',
        amount: 25.50,
        type: 'expense',
        category: 'Transporte',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed'
      },
      {
        _id: '3',
        description: 'Salário',
        amount: 5000.00,
        type: 'income',
        category: 'Salário',
        date: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed'
      }
    ]
  }

  res.json(dashboardData)
})

// Rota alternativa que o dashboard está tentando acessar
app.get('/api/transactions/summary/dashboard', authenticateToken, (req, res) => {
  // Dados mock para o dashboard (mesmo conteúdo)
  const dashboardData = {
    totalBalance: 15000.50,
    monthlyBalance: 2500.75,
    categoriesBreakdown: {
      expenses: [
        { category: 'Alimentação', amount: 800.00, percentage: 32 },
        { category: 'Transporte', amount: 400.00, percentage: 16 },
        { category: 'Lazer', amount: 300.00, percentage: 12 },
        { category: 'Saúde', amount: 200.00, percentage: 8 },
        { category: 'Outros', amount: 800.75, percentage: 32 }
      ],
      income: [
        { category: 'Salário', amount: 5000.00, percentage: 80 },
        { category: 'Freelance', amount: 800.00, percentage: 13 },
        { category: 'Investimentos', amount: 450.00, percentage: 7 }
      ]
    },
    recentTransactions: [
      {
        _id: '1',
        description: 'Supermercado Extra',
        amount: 150.00,
        type: 'expense',
        category: 'Alimentação',
        date: new Date().toISOString(),
        status: 'completed'
      },
      {
        _id: '2',
        description: 'Uber',
        amount: 25.50,
        type: 'expense',
        category: 'Transporte',
        date: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed'
      },
      {
        _id: '3',
        description: 'Salário',
        amount: 5000.00,
        type: 'income',
        category: 'Salário',
        date: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed'
      }
    ]
  }

  res.json(dashboardData)
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📊 Ambiente: development`)
  console.log(`🔗 URL: http://localhost:${PORT}`)
  console.log(`🌐 CORS habilitado para: http://localhost:3000`)
})

export default app