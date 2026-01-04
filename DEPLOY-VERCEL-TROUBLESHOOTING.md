# 🔧 Troubleshooting - Deploy no Vercel

## Problema: Erro de Conexão com MongoDB

Se você está tendo problemas para conectar ao MongoDB no Vercel, siga estes passos:

### 1. Verificar Variáveis de Ambiente no Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Verifique se as seguintes variáveis estão configuradas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/organizze-planner?retryWrites=true&w=majority
MONGODB_DB=planner
JWT_SECRET=seu-jwt-secret-aqui
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=sua-chave-gemini
NODE_ENV=production
CORS_ORIGIN=https://seu-projeto.vercel.app
```

### 2. Verificar MongoDB Atlas - Network Access

1. Acesse [MongoDB Atlas](https://cloud.mongodb.com)
2. Vá em **Network Access**
3. Certifique-se de que há uma entrada permitindo acesso de qualquer IP:
   - Clique em **Add IP Address**
   - Selecione **Allow Access from Anywhere**
   - Ou adicione `0.0.0.0/0`
4. Salve as alterações

### 3. Verificar MongoDB Atlas - Database User

1. No MongoDB Atlas, vá em **Database Access**
2. Verifique se o usuário existe e tem permissões de **Read and write to any database**
3. Se necessário, crie um novo usuário:
   - Username: seu-username
   - Password: sua-senha-forte
   - Database User Privileges: **Read and write to any database**

### 4. Verificar String de Conexão

A string de conexão deve estar no formato:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
```

**Importante:**
- Substitua `username` e `password` pelos valores reais
- Substitua `cluster0.xxxxx.mongodb.net` pela URL do seu cluster
- O `database-name` é opcional (pode ser especificado em `MONGODB_DB`)

### 5. Testar Conexão

Após configurar as variáveis de ambiente:

1. Faça um novo deploy no Vercel
2. Acesse: `https://seu-projeto.vercel.app/api/health`
3. Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "dbStatus": "connected"
}
```

Se `dbStatus` for `"disconnected"`, há um problema na conexão.

### 6. Verificar Logs do Vercel

1. No Vercel Dashboard, vá em **Deployments**
2. Clique no deployment mais recente
3. Vá em **Functions** → **api**
4. Veja os logs para erros de conexão

### 7. Erros Comuns

#### Erro: "MONGODB_URI não definida"
- **Solução**: Adicione `MONGODB_URI` nas variáveis de ambiente do Vercel

#### Erro: "Authentication failed"
- **Solução**: Verifique username e password no MongoDB Atlas

#### Erro: "ENOTFOUND"
- **Solução**: Verifique se o IP está liberado no Network Access do MongoDB Atlas

#### Erro: "Connection timeout"
- **Solução**: Verifique se a string de conexão está correta e se o cluster está ativo

### 8. Dica: Testar Localmente Primeiro

Antes de fazer deploy, teste localmente:

1. Configure o `.env` no servidor com as mesmas variáveis
2. Execute: `cd server && npm run dev`
3. Verifique se conecta ao MongoDB
4. Se funcionar localmente, o problema está na configuração do Vercel

---

**Se ainda tiver problemas**, verifique os logs do Vercel e compartilhe a mensagem de erro específica.

