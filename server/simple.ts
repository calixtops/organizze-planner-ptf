import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

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
    environment: process.env.NODE_ENV || 'development'
  })
})

// Rota de login simples para teste
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body
  
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 URL: http://localhost:${PORT}`)
})

export default app
