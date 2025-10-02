const express = require('express')
const cors = require('cors')

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
    message: 'Servidor funcionando!'
  })
})

// Mock transactions endpoint
app.post('/api/transactions', (req, res) => {
  console.log('Recebida transação:', req.body)
  res.json({ 
    success: true, 
    message: 'Transação salva com sucesso!',
    transaction: req.body
  })
})

// Mock dashboard endpoint
app.get('/api/transactions/summary/dashboard', (req, res) => {
  res.json({
    totalBalance: 5000,
    monthlyIncome: 3000,
    monthlyExpenses: 2000,
    categoriesBreakdown: {
      expenses: [
        { _id: 'Alimentação', total: 800 },
        { _id: 'Transporte', total: 400 },
        { _id: 'Moradia', total: 800 }
      ],
      income: [
        { _id: 'Salário', total: 3000 }
      ]
    }
  })
})

// Mock auth endpoint
app.get('/api/auth/me', (req, res) => {
  res.json({
    _id: 'test-user-id',
    name: 'Usuário Teste',
    email: 'teste@email.com'
  })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`)
  console.log(`🔗 URL: http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
})
