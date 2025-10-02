// Serviço para integração com Google Gemini API
const GEMINI_API_KEY = 'AIzaSyD_gvpLtsQ0rnpHiAIaNp9xa57oZThYqGY'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string
    }>
  }>
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

class GeminiService {
  private async makeRequest(prompt: string): Promise<string> {
    try {
      const requestBody: GeminiRequest = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }

      const data: GeminiResponse = await response.json()
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid response from Gemini API')
      }

      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error('Erro ao chamar Gemini API:', error)
      throw error
    }
  }

  // Categorização automática de transações
  async categorizeTransaction(description: string, amount: number): Promise<{
    category: string
    confidence: number
    explanation: string
  }> {
    const prompt = `
Analise a seguinte transação financeira e categorize-a automaticamente:

Descrição: "${description}"
Valor: R$ ${amount.toFixed(2)}

Categorias disponíveis:
- Alimentação (supermercado, restaurante, delivery)
- Transporte (gasolina, uber, transporte público, estacionamento)
- Moradia (aluguel, condomínio, energia, água, internet)
- Saúde (farmácia, médico, dentista, plano de saúde)
- Educação (curso, livro, material escolar)
- Lazer (cinema, parque, viagem, entretenimento)
- Compras (roupas, eletrônicos, produtos diversos)
- Serviços (manutenção, reparo, serviços profissionais)
- Assinaturas (streaming, software, serviços mensais)
- Investimentos (ações, fundos, poupança)
- Outros (categoria geral)

Responda APENAS no formato JSON:
{
  "category": "nome_da_categoria",
  "confidence": 0.95,
  "explanation": "explicação_breve_do_porquê"
}

Confidence deve ser um número entre 0 e 1 (1 = muito confiante, 0 = pouco confiante).
`

    try {
      const response = await this.makeRequest(prompt)
      const result = JSON.parse(response)
      
      return {
        category: result.category || 'Outros',
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
        explanation: result.explanation || 'Categoria sugerida automaticamente'
      }
    } catch (error) {
      console.error('Erro na categorização:', error)
      return {
        category: 'Outros',
        confidence: 0.1,
        explanation: 'Erro ao categorizar automaticamente'
      }
    }
  }

  // Análise de padrões de gastos
  async analyzeSpendingPatterns(transactions: Array<{
    description: string
    amount: number
    category: string
    date: string
  }>): Promise<{
    insights: string[]
    recommendations: string[]
    trends: string
  }> {
    const recentTransactions = transactions.slice(0, 20) // Últimas 20 transações
    
    const prompt = `
Analise os seguintes padrões de gastos e forneça insights úteis:

Transações recentes:
${recentTransactions.map(t => 
  `- ${t.description}: R$ ${t.amount.toFixed(2)} (${t.category}) - ${new Date(t.date).toLocaleDateString('pt-BR')}`
).join('\n')}

Forneça:
1. Insights sobre padrões de gastos (onde gasta mais, frequência, etc.)
2. Recomendações para melhorar as finanças
3. Tendências identificadas

Responda no formato JSON:
{
  "insights": ["insight1", "insight2", "insight3"],
  "recommendations": ["recomendação1", "recomendação2", "recomendação3"],
  "trends": "descrição_das_tendências"
}

Seja específico e útil. Foque em ações práticas.
`

    try {
      const response = await this.makeRequest(prompt)
      
      // Tentar extrair JSON da resposta com parsing mais robusto
      let result
      try {
        // Primeiro, tentar parsear diretamente
        result = JSON.parse(response)
      } catch (parseError) {
        console.log('JSON direto falhou, tentando extrair JSON do texto...')
        
        // Tentar encontrar JSON no texto com múltiplas estratégias
        let jsonText = response
        
        // Estratégia 1: Limpar caracteres problemáticos primeiro
        jsonText = response
          .replace(/```json\s*/g, '') // Remove ```json
          .replace(/```\s*/g, '') // Remove ```
          .replace(/^[^{]*/, '') // Remove texto antes do primeiro {
          .trim()
        
        // Estratégia 2: Encontrar o JSON completo (do primeiro { ou [ até o último } ou ])
        const firstBrace = jsonText.indexOf('{')
        const firstBracket = jsonText.indexOf('[')
        
        if (firstBrace !== -1 && firstBracket !== -1) {
          // Se tem ambos, usar o que aparece primeiro
          if (firstBrace < firstBracket) {
            const lastBrace = jsonText.lastIndexOf('}')
            if (lastBrace > firstBrace) {
              jsonText = jsonText.substring(firstBrace, lastBrace + 1)
            }
          } else {
            const lastBracket = jsonText.lastIndexOf(']')
            if (lastBracket > firstBracket) {
              jsonText = jsonText.substring(firstBracket, lastBracket + 1)
            }
          }
        } else if (firstBrace !== -1) {
          const lastBrace = jsonText.lastIndexOf('}')
          if (lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1)
          }
        } else if (firstBracket !== -1) {
          const lastBracket = jsonText.lastIndexOf(']')
          if (lastBracket > firstBracket) {
            jsonText = jsonText.substring(firstBracket, lastBracket + 1)
          }
        }
        
        try {
          console.log('Tentando parsear JSON extraído:', jsonText.substring(0, 200) + '...')
          result = JSON.parse(jsonText)
          console.log('JSON parseado com sucesso!')
          
          // Se for um array de transações, converter para formato de insights
          if (Array.isArray(result)) {
            const insights = result.map(item => 
              `${item.descrição || item.description || 'Transação'}: R$ ${Math.abs(item.valor || item.amount || 0)}`
            )
            return {
              insights: insights.slice(0, 5), // Limitar a 5 insights
              recommendations: ['Analise seus gastos por categoria', 'Defina metas de economia'],
              trends: `${result.length} transações analisadas`
            }
          }
        } catch (secondError) {
          console.error('Falha ao parsear JSON extraído:', jsonText)
          console.error('Erro de parsing:', secondError)
          
          // Última tentativa: retornar erro sem dados mock
          console.log('Retornando erro sem dados mock...')
          return {
            insights: ['Erro ao analisar dados'],
            recommendations: ['Tente novamente mais tarde'],
            trends: 'Análise indisponível'
          }
        }
      }
      
      return {
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        trends: result.trends || 'Nenhuma tendência clara identificada'
      }
    } catch (error) {
      console.error('Erro na análise:', error)
      return {
        insights: ['Erro ao analisar dados'],
        recommendations: ['Tente novamente mais tarde'],
        trends: 'Análise indisponível'
      }
    }
  }

  // Chat com assistente financeiro
  async chatWithAssistant(
    message: string, 
    userContext: {
      monthlyIncome: number
      monthlyExpenses: number
      categories: string[]
      recentTransactions: Array<{description: string, amount: number, category: string}>
    }
  ): Promise<string> {
    const prompt = `
Você é um assistente financeiro pessoal especializado em ajudar brasileiros a organizarem suas finanças.

Contexto do usuário:
- Renda mensal: R$ ${userContext.monthlyIncome.toFixed(2)}
- Gastos mensais: R$ ${userContext.monthlyExpenses.toFixed(2)}
- Saldo mensal: R$ ${(userContext.monthlyIncome - userContext.monthlyExpenses).toFixed(2)}
- Categorias principais: ${userContext.categories.join(', ')}

Últimas transações:
${userContext.recentTransactions.slice(0, 5).map(t => 
  `- ${t.description}: R$ ${t.amount.toFixed(2)} (${t.category})`
).join('\n')}

Pergunta do usuário: "${message}"

Responda de forma:
- Prática e específica para o contexto brasileiro
- Use valores em reais (R$)
- Seja encorajador mas realista
- Forneça dicas acionáveis
- Máximo 200 palavras

Resposta:`

    try {
      const response = await this.makeRequest(prompt)
      return response
    } catch (error) {
      console.error('Erro no chat:', error)
      return 'Desculpe, não consegui processar sua pergunta no momento. Tente novamente mais tarde.'
    }
  }

  // Sugestões de orçamento
  async suggestBudget(
    monthlyIncome: number,
    currentExpenses: Array<{category: string, amount: number}>
  ): Promise<{
    suggestedBudget: Array<{category: string, percentage: number, amount: number, tip: string}>
    totalRecommended: number
    savings: number
  }> {
    const totalExpenses = currentExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    
    const prompt = `
Sugira um orçamento mensal baseado na regra 50/30/20 e nas despesas atuais:

Renda mensal: R$ ${monthlyIncome.toFixed(2)}
Gastos atuais: R$ ${totalExpenses.toFixed(2)}

Categorias de gastos atuais:
${currentExpenses.map(exp => `- ${exp.category}: R$ ${exp.amount.toFixed(2)}`).join('\n')}

Regra 50/30/20:
- 50% necessidades (moradia, alimentação, transporte, saúde)
- 30% desejos (lazer, compras, entretenimento)
- 20% poupança e investimentos

Responda no formato JSON:
{
  "suggestedBudget": [
    {
      "category": "Alimentação",
      "percentage": 15,
      "amount": 1500,
      "tip": "dica específica"
    }
  ],
  "totalRecommended": 8000,
  "savings": 1600
}

Inclua todas as categorias principais e seja específico para o contexto brasileiro.
`

    try {
      const response = await this.makeRequest(prompt)
      
      // Tentar extrair JSON da resposta com parsing mais robusto
      let result
      try {
        // Primeiro, tentar parsear diretamente
        result = JSON.parse(response)
      } catch (parseError) {
        console.log('JSON direto falhou, tentando extrair JSON do texto...')
        
        // Tentar encontrar JSON no texto com múltiplas estratégias
        let jsonText = response
        
        // Estratégia 1: Limpar caracteres problemáticos primeiro
        jsonText = response
          .replace(/```json\s*/g, '') // Remove ```json
          .replace(/```\s*/g, '') // Remove ```
          .replace(/^[^{]*/, '') // Remove texto antes do primeiro {
          .trim()
        
        // Estratégia 2: Encontrar o JSON completo (do primeiro { ou [ até o último } ou ])
        const firstBrace = jsonText.indexOf('{')
        const firstBracket = jsonText.indexOf('[')
        
        if (firstBrace !== -1 && firstBracket !== -1) {
          // Se tem ambos, usar o que aparece primeiro
          if (firstBrace < firstBracket) {
            const lastBrace = jsonText.lastIndexOf('}')
            if (lastBrace > firstBrace) {
              jsonText = jsonText.substring(firstBrace, lastBrace + 1)
            }
          } else {
            const lastBracket = jsonText.lastIndexOf(']')
            if (lastBracket > firstBracket) {
              jsonText = jsonText.substring(firstBracket, lastBracket + 1)
            }
          }
        } else if (firstBrace !== -1) {
          const lastBrace = jsonText.lastIndexOf('}')
          if (lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1)
          }
        } else if (firstBracket !== -1) {
          const lastBracket = jsonText.lastIndexOf(']')
          if (lastBracket > firstBracket) {
            jsonText = jsonText.substring(firstBracket, lastBracket + 1)
          }
        }
        
        try {
          console.log('Tentando parsear JSON extraído:', jsonText.substring(0, 200) + '...')
          result = JSON.parse(jsonText)
          console.log('JSON parseado com sucesso!')
          
          // Se for um array de transações, converter para formato de insights
          if (Array.isArray(result)) {
            const insights = result.map(item => 
              `${item.descrição || item.description || 'Transação'}: R$ ${Math.abs(item.valor || item.amount || 0)}`
            )
            return {
              insights: insights.slice(0, 5), // Limitar a 5 insights
              recommendations: ['Analise seus gastos por categoria', 'Defina metas de economia'],
              trends: `${result.length} transações analisadas`
            }
          }
        } catch (secondError) {
          console.error('Falha ao parsear JSON extraído:', jsonText)
          console.error('Erro de parsing:', secondError)
          
          // Última tentativa: retornar erro sem dados mock
          console.log('Retornando erro sem dados mock...')
          return {
            insights: ['Erro ao analisar dados'],
            recommendations: ['Tente novamente mais tarde'],
            trends: 'Análise indisponível'
          }
        }
      }
      
      return {
        suggestedBudget: result.suggestedBudget || [],
        totalRecommended: result.totalRecommended || monthlyIncome * 0.8,
        savings: result.savings || monthlyIncome * 0.2
      }
    } catch (error) {
      console.error('Erro na sugestão de orçamento:', error)
      return {
        suggestedBudget: [],
        totalRecommended: monthlyIncome * 0.8,
        savings: monthlyIncome * 0.2
      }
    }
  }

  // Análise de oportunidades de economia
  async findSavingsOpportunities(
    transactions: Array<{
      description: string
      amount: number
      category: string
      date: string
    }>
  ): Promise<{
    opportunities: Array<{
      type: string
      description: string
      potentialSavings: number
      action: string
    }>
    totalPotentialSavings: number
  }> {
    const prompt = `
Analise as seguintes transações e identifique oportunidades de economia:

${transactions.slice(0, 30).map(t => 
  `- ${t.description}: R$ ${t.amount.toFixed(2)} (${t.category}) - ${new Date(t.date).toLocaleDateString('pt-BR')}`
).join('\n')}

Identifique:
1. Assinaturas desnecessárias
2. Gastos recorrentes que podem ser reduzidos
3. Oportunidades de desconto
4. Gastos supérfluos
5. Comparações de preços

Responda no formato JSON:
{
  "opportunities": [
    {
      "type": "Assinatura",
      "description": "Netflix + Spotify + Amazon Prime",
      "potentialSavings": 150,
      "action": "Considere cancelar serviços não utilizados"
    }
  ],
  "totalPotentialSavings": 500
}

Seja específico e prático. Foque em economia real.
`

    try {
      const response = await this.makeRequest(prompt)
      
      // Tentar extrair JSON da resposta com parsing mais robusto
      let result
      try {
        // Primeiro, tentar parsear diretamente
        result = JSON.parse(response)
      } catch (parseError) {
        console.log('JSON direto falhou, tentando extrair JSON do texto...')
        
        // Tentar encontrar JSON no texto com múltiplas estratégias
        let jsonText = response
        
        // Estratégia 1: Limpar caracteres problemáticos primeiro
        jsonText = response
          .replace(/```json\s*/g, '') // Remove ```json
          .replace(/```\s*/g, '') // Remove ```
          .replace(/^[^{]*/, '') // Remove texto antes do primeiro {
          .trim()
        
        // Estratégia 2: Encontrar o JSON completo (do primeiro { ou [ até o último } ou ])
        const firstBrace = jsonText.indexOf('{')
        const firstBracket = jsonText.indexOf('[')
        
        if (firstBrace !== -1 && firstBracket !== -1) {
          // Se tem ambos, usar o que aparece primeiro
          if (firstBrace < firstBracket) {
            const lastBrace = jsonText.lastIndexOf('}')
            if (lastBrace > firstBrace) {
              jsonText = jsonText.substring(firstBrace, lastBrace + 1)
            }
          } else {
            const lastBracket = jsonText.lastIndexOf(']')
            if (lastBracket > firstBracket) {
              jsonText = jsonText.substring(firstBracket, lastBracket + 1)
            }
          }
        } else if (firstBrace !== -1) {
          const lastBrace = jsonText.lastIndexOf('}')
          if (lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1)
          }
        } else if (firstBracket !== -1) {
          const lastBracket = jsonText.lastIndexOf(']')
          if (lastBracket > firstBracket) {
            jsonText = jsonText.substring(firstBracket, lastBracket + 1)
          }
        }
        
        try {
          console.log('Tentando parsear JSON extraído:', jsonText.substring(0, 200) + '...')
          result = JSON.parse(jsonText)
          console.log('JSON parseado com sucesso!')
          
          // Se for um array de transações, converter para formato de insights
          if (Array.isArray(result)) {
            const insights = result.map(item => 
              `${item.descrição || item.description || 'Transação'}: R$ ${Math.abs(item.valor || item.amount || 0)}`
            )
            return {
              insights: insights.slice(0, 5), // Limitar a 5 insights
              recommendations: ['Analise seus gastos por categoria', 'Defina metas de economia'],
              trends: `${result.length} transações analisadas`
            }
          }
        } catch (secondError) {
          console.error('Falha ao parsear JSON extraído:', jsonText)
          console.error('Erro de parsing:', secondError)
          
          // Última tentativa: retornar erro sem dados mock
          console.log('Retornando erro sem dados mock...')
          return {
            insights: ['Erro ao analisar dados'],
            recommendations: ['Tente novamente mais tarde'],
            trends: 'Análise indisponível'
          }
        }
      }
      
      return {
        opportunities: result.opportunities || [],
        totalPotentialSavings: result.totalPotentialSavings || 0
      }
    } catch (error) {
      console.error('Erro na análise de economia:', error)
      return {
        opportunities: [],
        totalPotentialSavings: 0
      }
    }
  }
}

export const geminiService = new GeminiService()
export default geminiService
