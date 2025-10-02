# 🚀 Guia de Deploy - Organizze Planner

Este guia fornece instruções detalhadas para fazer o deploy da aplicação Organizze Planner no Vercel.

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [MongoDB Atlas](https://www.mongodb.com/atlas)
- Conta na [OpenAI](https://openai.com) (opcional, para funcionalidade de IA)
- Git configurado

## 🗄️ 1. Configuração do MongoDB Atlas

### 1.1 Criar Cluster
1. Acesse [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crie uma nova conta ou faça login
3. Crie um novo cluster (free tier é suficiente para desenvolvimento)
4. Configure o nome do cluster (ex: `organizze-cluster`)

### 1.2 Configurar Acesso
1. Vá para **Database Access**
2. Adicione um novo usuário com permissões de leitura e escrita
3. Anote o username e password criados

### 1.3 Configurar Network Access
1. Vá para **Network Access**
2. Adicione `0.0.0.0/0` para permitir acesso de qualquer IP (ou configure IPs específicos)

### 1.4 Obter Connection String
1. Vá para **Clusters**
2. Clique em **Connect**
3. Escolha **Connect your application**
4. Copie a connection string (ex: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)

## 🤖 2. Configuração da OpenAI (Opcional)

### 2.1 Criar API Key
1. Acesse [OpenAI Platform](https://platform.openai.com)
2. Crie uma conta ou faça login
3. Vá para **API Keys**
4. Crie uma nova API key
5. Anote a chave criada

## 🚀 3. Deploy no Vercel

### 3.1 Preparar o Repositório
1. Faça push do código para o GitHub
2. Certifique-se de que todos os arquivos estão commitados

### 3.2 Importar Projeto no Vercel
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **New Project**
3. Importe o repositório do GitHub
4. Configure as seguintes opções:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Configurar Variáveis de Ambiente
No Vercel, vá para **Settings** → **Environment Variables** e adicione:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/organizze
MONGODB_DB=planner

# JWT
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_EXPIRES_IN=7d

# OpenAI (opcional)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Ambiente
NODE_ENV=production

# CORS (será preenchido automaticamente pelo Vercel)
CORS_ORIGIN=https://seu-projeto.vercel.app
```

### 3.4 Deploy
1. Clique em **Deploy**
2. Aguarde o build completar
3. Anote a URL gerada (ex: `https://seu-projeto.vercel.app`)

## 🔧 4. Configurações Adicionais

### 4.1 Atualizar CORS_ORIGIN
Após o deploy, atualize a variável `CORS_ORIGIN` no Vercel com a URL real da sua aplicação.

### 4.2 Configurar Domínio Personalizado (Opcional)
1. No Vercel, vá para **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

## 🧪 5. Teste da Aplicação

### 5.1 Verificar Health Check
Acesse: `https://seu-projeto.vercel.app/api/health`

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 5.2 Testar Funcionalidades
1. Acesse a aplicação principal
2. Crie uma conta de usuário
3. Adicione uma conta bancária
4. Crie uma transação
5. Teste a funcionalidade de IA (se configurada)

## 🛠️ 6. Solução de Problemas

### 6.1 Erro de Conexão com MongoDB
- Verifique se a connection string está correta
- Confirme se o IP está liberado no MongoDB Atlas
- Verifique se o usuário tem as permissões corretas

### 6.2 Erro de CORS
- Verifique se `CORS_ORIGIN` está configurado corretamente
- Confirme se a URL da aplicação está correta

### 6.3 Erro de Build
- Verifique os logs de build no Vercel
- Confirme se todas as dependências estão instaladas
- Verifique se não há erros de TypeScript

### 6.4 IA Não Funciona
- Verifique se `OPENAI_API_KEY` está configurada
- Confirme se a chave da OpenAI é válida
- Verifique se há créditos disponíveis na conta OpenAI

## 📊 7. Monitoramento

### 7.1 Logs
- Acesse **Functions** no Vercel para ver logs das funções serverless
- Use `console.log` para debug (remover em produção)

### 7.2 Analytics
- Configure analytics no Vercel para monitorar performance
- Use ferramentas como Google Analytics para métricas de uso

## 🔄 8. Atualizações

### 8.1 Deploy Automático
O Vercel faz deploy automático quando você faz push para a branch principal.

### 8.2 Deploy Manual
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

## 🚨 9. Segurança

### 9.1 Variáveis Sensíveis
- Nunca commite arquivos `.env`
- Use apenas variáveis de ambiente do Vercel
- Rotacione chaves periodicamente

### 9.2 MongoDB
- Use autenticação forte
- Configure network access restritivo
- Monitore acessos

### 9.3 OpenAI
- Monitore uso da API
- Configure limites de rate limiting
- Rotacione chaves periodicamente

## 📞 10. Suporte

Se encontrar problemas:
1. Verifique os logs do Vercel
2. Consulte a documentação do Vercel
3. Abra uma issue no repositório
4. Entre em contato com o suporte

---

**Sucesso! 🎉** Sua aplicação Organizze Planner está rodando no Vercel!
