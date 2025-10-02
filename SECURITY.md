# 🔒 Segurança - Organizze Planner

Este documento descreve as medidas de segurança implementadas no Organizze Planner e como manter a aplicação segura.

## 🛡️ Medidas de Segurança Implementadas

### 1. Autenticação e Autorização
- **JWT (JSON Web Tokens)**: Autenticação segura com tokens que expiram
- **Middleware de autenticação**: Proteção de rotas sensíveis
- **Hash de senhas**: Uso do bcryptjs com salt de 12 rounds
- **Validação de entrada**: Sanitização de todos os inputs do usuário

### 2. Proteção de Dados
- **Decimal.js**: Precisão matemática para valores financeiros
- **Validação rigorosa**: Express-validator para todos os endpoints
- **Sanitização**: Limpeza de dados de entrada
- **MongoDB**: Proteção contra NoSQL injection

### 3. Segurança HTTP
- **Helmet.js**: Headers de segurança HTTP
- **CORS**: Configuração adequada de origens permitidas
- **Rate Limiting**: Proteção contra ataques de força bruta
- **Compression**: Otimização de resposta com compressão segura

### 4. Gerenciamento de Segredos
- **Variáveis de ambiente**: Todas as chaves sensíveis em env vars
- **Não commit de secrets**: .env no .gitignore
- **Rotação de chaves**: Instruções para rotação periódica

## 🚨 Vulnerabilidades Identificadas

### Frontend (3 vulnerabilidades)
```
esbuild  <=0.24.2 - Moderate
vite  <=6.1.6 - Moderate  
@vitejs/plugin-react - Low
```

### Backend (5 vulnerabilidades)
```
axios  <=1.11.0 - High (3 vulnerabilidades)
semver  7.0.0 - 7.5.1 - High
```

## 🔧 Correções Recomendadas

### 1. Atualizar Dependências
```bash
# Frontend
npm audit fix --force

# Backend
cd server
npm audit fix --force
```

### 2. Verificações Pós-Atualização
Após executar `npm audit fix --force`:
1. Teste todas as funcionalidades
2. Verifique se não há breaking changes
3. Execute testes de integração
4. Faça deploy em ambiente de staging primeiro

### 3. Monitoramento Contínuo
```bash
# Executar auditoria regularmente
npm audit

# Verificar dependências desatualizadas
npm outdated
```

## 🔐 Configuração de Segurança

### 1. Variáveis de Ambiente Seguras
```env
# JWT - Use uma chave forte e única
JWT_SECRET=seu-jwt-secret-super-seguro-com-pelo-menos-32-caracteres

# MongoDB - Use credenciais fortes
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database

# OpenAI - Mantenha a chave segura
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Configuração do MongoDB Atlas
- **Network Access**: Configure IPs específicos ou 0.0.0.0/0 apenas se necessário
- **Database Users**: Use credenciais fortes e permissões mínimas necessárias
- **Encryption**: Ative encryption at rest e in transit
- **Backup**: Configure backups automáticos

### 3. Configuração do Vercel
- **Environment Variables**: Use apenas variáveis de ambiente do Vercel
- **Function Timeout**: Configure timeout adequado (30s)
- **Rate Limiting**: Configure limites de API apropriados

## 🚨 Plano de Resposta a Incidentes

### 1. Detecção de Vulnerabilidades
1. Execute `npm audit` semanalmente
2. Monitore logs de segurança
3. Configure alertas para tentativas de acesso suspeitas

### 2. Resposta a Vulnerabilidades Críticas
1. **Imediato**: Avaliar impacto da vulnerabilidade
2. **1 hora**: Implementar correção ou mitigação
3. **24 horas**: Deploy da correção em produção
4. **48 horas**: Teste de regressão completo

### 3. Comunicação
- Notificar usuários sobre incidentes de segurança
- Documentar vulnerabilidades e correções
- Manter log de auditoria de segurança

## 🔍 Checklist de Segurança

### Desenvolvimento
- [ ] Todas as dependências auditadas
- [ ] Variáveis sensíveis em environment variables
- [ ] Validação de entrada em todos os endpoints
- [ ] Autenticação em rotas protegidas
- [ ] Headers de segurança configurados

### Deploy
- [ ] HTTPS habilitado
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Logs de segurança configurados
- [ ] Backup do banco de dados

### Manutenção
- [ ] Auditoria de dependências regular
- [ ] Monitoramento de logs
- [ ] Rotação de chaves periódica
- [ ] Atualização de dependências
- [ ] Testes de segurança

## 📚 Recursos Adicionais

### Documentação
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/security/)

### Ferramentas
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/) - Análise de vulnerabilidades
- [OWASP ZAP](https://www.zaproxy.org/) - Teste de penetração

## 📞 Contato de Segurança

Para reportar vulnerabilidades de segurança:
1. **Não** abra issues públicas
2. Envie email para: security@organizze-planner.com
3. Inclua detalhes da vulnerabilidade
4. Aguarde resposta em até 48 horas

---

**⚠️ Importante**: Este documento deve ser revisado e atualizado regularmente conforme novas vulnerabilidades são descobertas e correções são implementadas.
