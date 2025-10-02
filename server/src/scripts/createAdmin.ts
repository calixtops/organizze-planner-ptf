import User from '../models/User.js'
import bcrypt from 'bcryptjs'

async function createAdminUser() {
  try {
    // Verificar se já existe um usuário admin
    const existingAdmin = await User.findOne({ username: 'admin' })
    
    if (existingAdmin) {
      console.log('✅ Usuário admin já existe')
      return
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash('admin', salt)

    // Criar usuário admin
    const adminUser = new User({
      name: 'Administrador',
      username: 'admin',
      password: hashedPassword
    })

    await adminUser.save()
    
    console.log('✅ Usuário admin criado com sucesso!')
    console.log('👤 Username: admin')
    console.log('🔑 Senha: admin')
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!')
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error)
  }
}

export default createAdminUser
