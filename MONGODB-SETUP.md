# 🗄️ Configuração do MongoDB Atlas

## Passo a Passo Completo

### 1. Criar Conta no MongoDB Atlas
1. Acesse: https://www.mongodb.com/atlas
2. Clique em "Try Free" 
3. Crie uma conta com email/senha
4. Escolha o plano gratuito (M0 Sandbox)

### 2. Criar Cluster
1. Escolha "Build a Database"
2. Selecione "M0 Sandbox" (gratuito)
3. Escolha uma região próxima (ex: São Paulo)
4. Nome do cluster: `organizze-planner`
5. Clique em "Create"

### 3. Configurar Acesso
1. **Database User:**
   - Username: `organizze-user`
   - Password: `organizze123` (ou sua senha)
   - Database User Privileges: "Read and write to any database"

2. **Network Access:**
   - IP Address: `0.0.0.0/0` (permite acesso de qualquer IP)
   - Ou adicione seu IP específico

### 4. Obter String de Conexão
1. Clique em "Connect" no cluster
2. Escolha "Connect your application"
3. Driver: Node.js
4. Version: 4.1 or later
5. Copie a string de conexão

### 5. Configurar o .env
No arquivo `server/.env`, substitua:

```env
MONGODB_URI=mongodb+srv://organizze-user:organizze123@cluster0.xxxxx.mongodb.net/organizze-planner?retryWrites=true&w=majority
```

**Substitua:**
- `organizze-user` pelo seu username
- `organizze123` pela sua senha
- `cluster0.xxxxx.mongodb.net` pela URL do seu cluster

### 6. Testar Conexão
```bash
cd server
npm run dev
```

Se tudo estiver correto, você verá:
```
✅ Conectado ao MongoDB
🚀 Servidor rodando na porta 5000
```

### 7. Estrutura do Banco
O sistema criará automaticamente estas coleções:
- `users` - Dados dos usuários
- `transactions` - Transações financeiras
- `accounts` - Contas bancárias
- `creditcards` - Cartões de crédito
- `categories` - Categorias de transações

## 🔧 Troubleshooting

### Erro: "ENOTFOUND _mongodb._tcp.cluster.mongodb.net"
- Verifique se a string de conexão está correta
- Confirme se o usuário tem permissões de leitura/escrita
- Verifique se o IP está liberado no Network Access

### Erro: "Authentication failed"
- Verifique username e password no .env
- Confirme se o usuário foi criado corretamente

### Erro: "Connection timeout"
- Verifique se o IP `0.0.0.0/0` está liberado
- Ou adicione seu IP específico

## 📊 Dados Reais vs Mock

### Com MongoDB Configurado:
- ✅ Transações salvas no banco
- ✅ Dados persistem entre sessões
- ✅ Múltiplos usuários
- ✅ Backup automático (Atlas)

### Com Dados Mock (temporário):
- ❌ Dados só no localStorage
- ❌ Perdidos ao limpar navegador
- ❌ Sem backup

## 🚀 Próximos Passos

1. Configure o MongoDB Atlas
2. Teste o login/registro
3. Importe suas transações do C6 Bank
4. Teste todas as funcionalidades
5. Deploy para produção (Vercel + MongoDB Atlas)
