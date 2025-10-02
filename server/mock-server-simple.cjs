const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = 5000

// Middleware
app.use(cors())
app.use(express.json())

// Simular banco de dados em memória
let transactions = []
let users = []

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor Mock funcionando!',
    timestamp: new Date().toISOString(),
    transactions: transactions.length
  })
})

// Limpar todas as transações
app.delete('/api/transactions/clear-all', (req, res) => {
  const count = transactions.length
  transactions.length = 0 // Limpar array
  res.json({
    message: `Todas as ${count} transações foram removidas`,
    count: count
  })
})

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username e password são obrigatórios'
    })
  }

  const user = {
    _id: 'mock-user-id',
    name: 'Usuário Demo',
    username: username,
    email: `${username}@demo.com`,
    createdAt: new Date().toISOString()
  }

  const token = jwt.sign(
    { userId: user._id },
    'mock-secret-key',
    { expiresIn: '7d' }
  )

  res.json({
    success: true,
    message: 'Login realizado com sucesso',
    token,
    user
  })
})

app.post('/api/auth/register', (req, res) => {
  const { name, username, password } = req.body
  
  if (!name || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nome, username e password são obrigatórios'
    })
  }

  const user = {
    _id: 'mock-user-id',
    name: name,
    username: username,
    email: `${username}@demo.com`,
    createdAt: new Date().toISOString()
  }

  const token = jwt.sign(
    { userId: user._id },
    'mock-secret-key',
    { expiresIn: '7d' }
  )

  res.json({
    success: true,
    message: 'Usuário criado com sucesso',
    token,
    user
  })
})

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso não fornecido'
    })
  }

  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, 'mock-secret-key')
    
    const user = {
      _id: decoded.userId || 'mock-user-id',
      name: 'Usuário Demo',
      username: 'demo',
      email: 'demo@demo.com',
      createdAt: new Date().toISOString()
    }

    res.json(user)
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    })
  }
})

// Transaction routes
app.post('/api/transactions', (req, res) => {
  const transactionData = {
    ...req.body,
    _id: 'transaction-' + Date.now(),
    userId: 'mock-user-id',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  transactions.push(transactionData)
  
  console.log(`✅ Transação salva: ${transactionData.description} - R$ ${transactionData.amount}`)
  
  res.status(201).json({
    success: true,
    message: 'Transação salva com sucesso!',
    transaction: transactionData
  })
})

app.get('/api/transactions', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 20
  const skip = (page - 1) * limit
  
  const userTransactions = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(skip, skip + limit)
  
  res.json({
    transactions: userTransactions,
    total: transactions.length,
    page,
    limit,
    pages: Math.ceil(transactions.length / limit)
  })
})

app.get('/api/transactions/summary/dashboard', (req, res) => {
  // Calcular saldo total baseado nas transações reais
  // Para transações de despesa (amount negativo), manter negativo
  // Para transações de receita (amount positivo), manter positivo
  const totalBalance = transactions.reduce((sum, t) => {
    return sum + parseFloat(t.amount)
  }, 0)
  const monthlyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)
  const monthlyBalance = monthlyIncome - monthlyExpenses

  // Calcular categorias baseadas nas transações reais
  const categoryTotals = {}
  const categoryCounts = {}
  
  transactions.forEach(t => {
    const category = t.category || 'Outros'
    const amount = parseFloat(t.amount)
    
    if (t.type === 'expense') {
      // Para despesas, usar valor absoluto
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(amount)
    } else if (t.type === 'income') {
      // Para receitas, usar valor positivo
      categoryTotals[category] = (categoryTotals[category] || 0) + amount
    }
    
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  const categoriesBreakdown = {
    expenses: Object.entries(categoryTotals)
      .filter(([category, total]) => {
        // Filtrar apenas categorias que têm transações de despesa
        return transactions.some(t => t.category === category && t.type === 'expense')
      })
      .map(([category, total]) => ({
        _id: category,
        total: total,
        count: categoryCounts[category]
      })),
    income: Object.entries(categoryTotals)
      .filter(([category, total]) => {
        // Filtrar apenas categorias que têm transações de receita
        return transactions.some(t => t.category === category && t.type === 'income')
      })
      .map(([category, total]) => ({
        _id: category,
        total: total,
        count: categoryCounts[category]
      }))
  }

  // Gerar tendência mensal baseada nas transações reais
  const monthlyTrend = []
  
  if (transactions.length > 0) {
    // Agrupar transações por mês
    const monthlyData = {}
    
    transactions.forEach(t => {
      const tDate = new Date(t.date)
      const monthKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`
      const monthStr = tDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthStr,
          income: 0,
          expenses: 0,
          date: tDate
        }
      }
      
      if (t.type === 'income') {
        monthlyData[monthKey].income += parseFloat(t.amount)
      } else if (t.type === 'expense') {
        monthlyData[monthKey].expenses += Math.abs(parseFloat(t.amount))
      }
    })
    
    // Converter para array e ordenar por data
    monthlyTrend.push(...Object.values(monthlyData)
      .sort((a, b) => a.date - b.date)
      .slice(-3) // Últimos 3 meses
      .map(item => ({
        month: item.month,
        income: item.income,
        expenses: item.expenses,
        balance: item.income - item.expenses
      })))
  }
  
  // Se não há transações ou menos de 3 meses de dados, completar com meses vazios
  if (monthlyTrend.length < 3) {
    const now = new Date()
    const existingMonths = new Set(monthlyTrend.map(item => item.month))
    
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
      
      if (!existingMonths.has(monthStr)) {
        monthlyTrend.push({
          month: monthStr,
          income: 0,
          expenses: 0,
          balance: 0
        })
      }
    }
    
    // Ordenar por data
    monthlyTrend.sort((a, b) => {
      const monthOrder = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const aMonth = monthOrder.indexOf(a.month.split(' ')[0])
      const bMonth = monthOrder.indexOf(b.month.split(' ')[0])
      return aMonth - bMonth
    })
  }

  res.json({
    totalBalance,
    monthlyIncome,
    monthlyExpenses: Math.abs(monthlyExpenses),
    monthlyBalance,
    categoriesBreakdown,
    monthlyTrend
  })
})

// Accounts routes (mock)
app.get('/api/accounts', (req, res) => {
  res.json([])
})

app.get('/api/credit-cards', (req, res) => {
  res.json([])
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor Mock rodando na porta ${PORT}`)
  console.log(`🔗 URL: http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🔐 Auth endpoints: /api/auth/login, /api/auth/register, /api/auth/me`)
  console.log(`💰 Transaction endpoints: /api/transactions`)
  console.log(`📈 Dashboard: /api/transactions/summary/dashboard`)
  console.log(`\n💾 Transações salvas em memória: ${transactions.length}`)
})
