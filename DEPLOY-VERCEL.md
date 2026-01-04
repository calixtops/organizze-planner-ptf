# 🚀 Guia de Deploy no Vercel - Organizze Planner

Este guia fornece instruções passo a passo para fazer o deploy da aplicação no Vercel.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Chave da API Gemini (para o Assistente Financeiro)
- Repositório Git (GitHub, GitLab ou Bitbucket)

## 🛠️ Passo 1: Preparar o Projeto

### 1.1 Commit e Push do Código

Certifique-se de que todo o código está commitado e enviado para o repositório:

```bash
git add .
git commit -m "Preparar para deploy no Vercel"
git push origin main
```

### 1.2 Verificar Estrutura

A estrutura do projeto deve estar assim:
```
organizze-planner/
├── api/
│   └── index.ts          # Handler serverless para Vercel
├── server/
│   └── src/
│       └── index.ts      # App Express
├── src/                  # Frontend React
├── vercel.json           # Configuração do Vercel
├── package.json
└── vite.config.ts
```

## 🔧 Passo 2: Configurar no Vercel

### 2.1 Importar Projeto

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **Add New Project**
3. Conecte seu repositório Git
4. Selecione o repositório do projeto

### 2.2 Configurações do Projeto

Configure as seguintes opções:

- **Framework Preset**: Vite
- **Root Directory**: `./` (raiz do projeto)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.3 Variáveis de Ambiente

No Vercel, vá para **Settings** → **Environment Variables** e adicione:

```env
# MongoDB (OBRIGATÓRIO)
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/organizze-planner
MONGODB_DB=planner

# JWT (OBRIGATÓRIO)
JWT_SECRET=seu-jwt-secret-super-seguro-com-pelo-menos-32-caracteres
JWT_EXPIRES_IN=7d

# Gemini AI (para Assistente Financeiro)
GEMINI_API_KEY=AIzaSyD_gvpLtsQ0rnpHiAIaNp9xa57oZThYqGY

# Ambiente
NODE_ENV=production

# CORS (OBRIGATÓRIO - atualize após o deploy)
CORS_ORIGIN=https://seu-projeto.vercel.app
```

⚠️ **IMPORTANTE**: 
- Gere um `JWT_SECRET` forte e único (pode usar: `openssl rand -base64 32`)
- Após o primeiro deploy, atualize `CORS_ORIGIN` com a URL real do Vercel

### 2.4 Configurar MongoDB Atlas

1. Acesse [MongoDB Atlas](https://cloud.mongodb.com)
2. Vá em **Network Access**
3. Adicione `0.0.0.0/0` para permitir acesso de qualquer IP (ou apenas IPs do Vercel)
4. Vá em **Database Access** e crie um usuário com senha
5. Copie a connection string e use no `MONGODB_URI`

## 🚀 Passo 3: Deploy

### 3.1 Deploy Inicial

1. No Vercel, clique em **Deploy**
2. Aguarde o build completar (pode levar alguns minutos)
3. Anote a URL gerada (ex: `https://organizze-planner.vercel.app`)

### 3.2 Atualizar CORS_ORIGIN

Após o primeiro deploy:

1. Vá em **Settings** → **Environment Variables**
2. Edite `CORS_ORIGIN` e substitua pela URL real do seu projeto
3. Faça um novo deploy (ou aguarde o redeploy automático)

## ✅ Passo 4: Verificar Deploy

### 4.1 Health Check

Acesse: `https://seu-projeto.vercel.app/api/health`

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 4.2 Testar Aplicação

1. Acesse a URL do projeto
2. Crie uma conta de usuário
3. Teste as funcionalidades principais:
   - Login/Registro
   - Dashboard
   - Adicionar gastos
   - Assistente Financeiro (se GEMINI_API_KEY estiver configurada)

## 🔍 Passo 5: Monitoramento e Logs

### 5.1 Ver Logs

No Vercel:
- **Deployments** → Selecione o deployment → **Functions** → Ver logs
- Ou use: `vercel logs` (se tiver CLI instalada)

### 5.2 Verificar Erros

- **Functions** → Veja logs de cada serverless function
- Verifique se MongoDB está conectando
- Verifique se variáveis de ambiente estão carregadas

## 🐛 Solução de Problemas

### Erro: "Cannot find module"

**Solução**: Verifique se todas as dependências estão no `package.json` e que o build está funcionando localmente.

### Erro: "MongoDB connection failed"

**Solução**: 
- Verifique se `MONGODB_URI` está correto
- Verifique se o IP está liberado no MongoDB Atlas
- Verifique se o usuário tem permissões corretas

### Erro: "CORS error"

**Solução**:
- Verifique se `CORS_ORIGIN` está configurado com a URL correta do Vercel
- Certifique-se de que não há barra (`/`) no final da URL

### Assistente Financeiro não funciona

**Solução**:
- Verifique se `GEMINI_API_KEY` está configurada
- Verifique os logs do Vercel para erros da API Gemini
- Teste a chave localmente primeiro

### Build falha

**Solução**:
- Execute `npm run build` localmente para ver erros
- Verifique se há erros de TypeScript
- Verifique se todas as dependências estão instaladas

## 📝 Deploy Automático

O Vercel faz deploy automático quando você faz push para a branch principal (geralmente `main` ou `master`).

Para fazer deploy manual:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 🔐 Segurança

- ✅ Nunca commite arquivos `.env`
- ✅ Use apenas variáveis de ambiente do Vercel
- ✅ Use `JWT_SECRET` forte e único
- ✅ Rotacione chaves periodicamente
- ✅ Configure MongoDB com acesso restritivo
- ✅ Monitore logs para atividade suspeita

## 📊 Próximos Passos

- [ ] Configurar domínio personalizado (opcional)
- [ ] Configurar analytics
- [ ] Configurar monitoramento de erros (Sentry, etc.)
- [ ] Configurar CI/CD adicional (se necessário)

---

**Sucesso! 🎉** Sua aplicação está rodando no Vercel!

Para ajuda adicional, consulte a [documentação do Vercel](https://vercel.com/docs).

