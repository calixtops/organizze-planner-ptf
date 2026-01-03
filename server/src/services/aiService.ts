import { GoogleGenerativeAI } from '@google/generative-ai'
import Transaction from '../models/Transaction.js'

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY não definida. Funcionalidade de IA será desabilitada.')
  console.warn('   Verifique se a chave está no arquivo .env e reinicie o servidor.')
} else {
  console.log('✅ GEMINI_API_KEY carregada com sucesso')
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null
const model = genAI ? genAI.getGenerativeModel({ model: 'gemini-pro' }) : null

export interface AISuggestion {
  category: string
  confidence: number
  explanation: string
}

// Categorias padrão para receitas e despesas
const DEFAULT_CATEGORIES = {
  income: [
    'Salário',
    'Freelance',
    'Investimentos',
    'Vendas',
    'Bônus',
    'Outros'
  ],
  expense: [
    'Alimentação',
    'Transporte',
    'Moradia',
    'Saúde',
    'Educação',
    'Lazer',
    'Compras',
    'Serviços',
    'Assinaturas',
    'Outros'
  ]
}

/**
 * Busca transações históricas similares para usar como contexto
 */
async function findSimilarTransactions(
  userId: string,
  description: string,
  type: 'income' | 'expense',
  limit: number = 5
): Promise<any[]> {
  try {
    // Buscar transações do mesmo tipo do usuário
    const transactions = await Transaction.find({
      userId,
      type,
      category: { $exists: true, $ne: '' }
    })
    .sort({ createdAt: -1 })
    .limit(100) // Limitar busca para performance

    if (transactions.length === 0) {
      return []
    }

    // Implementação simples de similaridade baseada em palavras-chave
    const descriptionWords = description.toLowerCase().split(/\s+/)
    
    const scoredTransactions = transactions.map(transaction => {
      const transactionWords = transaction.description.toLowerCase().split(/\s+/)
      
      // Calcular similaridade por intersecção de palavras
      const intersection = descriptionWords.filter(word => 
        transactionWords.includes(word) && word.length > 2
      )
      
      const score = intersection.length / Math.max(descriptionWords.length, transactionWords.length)
      
      return {
        ...transaction.toObject(),
        similarityScore: score
      }
    })

    // Ordenar por similaridade e retornar as mais similares
    return scoredTransactions
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .filter(t => t.similarityScore > 0.1) // Apenas transações com alguma similaridade

  } catch (error) {
    console.error('Erro ao buscar transações similares:', error)
    return []
  }
}

/**
 * Gera sugestão de categoria usando Gemini
 */
async function generateCategorySuggestion(
  description: string,
  amount: number,
  type: 'income' | 'expense',
  similarTransactions: any[]
): Promise<AISuggestion> {
  if (!model) {
    // Fallback para categorias padrão se Gemini não estiver configurada
    const categories = DEFAULT_CATEGORIES[type]
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    
    return {
      category: randomCategory,
      confidence: 0.5,
      explanation: 'Categoria sugerida automaticamente (Gemini não configurada)'
    }
  }

  try {
    // Preparar contexto das transações similares
    const contextTransactions = similarTransactions
      .slice(0, 3) // Usar apenas as 3 mais similares
      .map(t => `"${t.description}" -> ${t.category}`)
      .join('\n')

    const categoriesList = type === 'income' 
      ? DEFAULT_CATEGORIES.income.join(', ') 
      : DEFAULT_CATEGORIES.expense.join(', ')

    const prompt = `Você é um assistente especializado em categorização de transações financeiras pessoais.

Categorias disponíveis para ${type === 'income' ? 'RECEITAS' : 'DESPESAS'}:
${categoriesList}

Analise a seguinte transação e sugira a categoria mais apropriada:

Descrição: "${description}"
Valor: R$ ${amount.toFixed(2)}
Tipo: ${type === 'income' ? 'Receita' : 'Despesa'}

${contextTransactions ? `Transações similares do usuário:\n${contextTransactions}` : 'Nenhuma transação similar encontrada'}

Responda APENAS em formato JSON válido, sem markdown ou código:
{
  "category": "Nome da categoria exata da lista acima",
  "confidence": 0.95,
  "explanation": "Explicação breve do motivo em português"
}`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Extrair JSON da resposta (pode vir com markdown)
    let jsonText = text.trim()
    // Remover markdown code blocks se existirem
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Tentar fazer parse do JSON
    let suggestion: AISuggestion
    try {
      suggestion = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta do Gemini:', text)
      // Tentar extrair JSON manualmente
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Resposta inválida do Gemini')
      }
    }

    // Validar resposta
    if (!suggestion.category || typeof suggestion.confidence !== 'number' || !suggestion.explanation) {
      throw new Error('Formato de resposta inválido do Gemini')
    }

    // Garantir que a confiança esteja entre 0 e 1
    suggestion.confidence = Math.max(0, Math.min(1, suggestion.confidence))

    // Validar se a categoria está na lista
    const validCategories = DEFAULT_CATEGORIES[type]
    if (!validCategories.includes(suggestion.category)) {
      // Se a categoria sugerida não estiver na lista, usar "Outros"
      console.warn(`Categoria "${suggestion.category}" não está na lista válida. Usando "Outros".`)
      suggestion.category = 'Outros'
      suggestion.confidence = Math.min(suggestion.confidence, 0.7)
    }

    return suggestion

  } catch (error: any) {
    console.error('Erro ao gerar sugestão de categoria:', error.message)
    
    // Fallback para categorias padrão em caso de erro
    const categories = DEFAULT_CATEGORIES[type]
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    
    return {
      category: randomCategory,
      confidence: 0.3,
      explanation: `Erro na IA: ${error.message}. Categoria sugerida automaticamente.`
    }
  }
}

/**
 * Função principal para sugerir categoria de transação
 */
export async function suggestTransactionCategory(
  userId: string,
  description: string,
  amount: number,
  type: 'income' | 'expense'
): Promise<AISuggestion> {
  try {
    // Buscar transações similares
    const similarTransactions = await findSimilarTransactions(
      userId,
      description,
      type,
      5
    )

    // Gerar sugestão usando IA
    const suggestion = await generateCategorySuggestion(
      description,
      amount,
      type,
      similarTransactions
    )

    return suggestion

  } catch (error: any) {
    console.error('Erro no serviço de IA:', error.message)
    
    // Fallback final
    const categories = DEFAULT_CATEGORIES[type]
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    
    return {
      category: randomCategory,
      confidence: 0.1,
      explanation: 'Erro no sistema de IA. Categoria padrão aplicada.'
    }
  }
}

/**
 * Aprender com feedback do usuário para melhorar futuras sugestões
 */
export async function learnFromFeedback(
  userId: string,
  originalSuggestion: AISuggestion,
  userChoice: string,
  description: string
): Promise<void> {
  try {
    // Aqui você poderia implementar um sistema de aprendizado
    // Por exemplo, armazenar feedbacks para melhorar o modelo
    // ou ajustar pesos de similaridade
    
    console.log('Feedback recebido:', {
      userId,
      originalSuggestion,
      userChoice,
      description
    })

    // Implementação futura: salvar feedback em uma coleção separada
    // para análise e melhoria do modelo

  } catch (error) {
    console.error('Erro ao processar feedback:', error)
  }
}

/**
 * Chat com assistente financeiro usando Gemini
 */
export async function chatWithAssistant(
  message: string,
  userContext?: {
    monthlyIncome?: number
    monthlyExpenses?: number
    categories?: string[]
    recentTransactions?: any[]
  }
): Promise<string> {
  if (!model) {
    return 'Desculpe, o assistente financeiro não está disponível no momento. Verifique se a chave da API Gemini está configurada.'
  }

  try {
    // Construir contexto para o prompt
    let contextInfo = ''
    
    if (userContext) {
      const contextParts: string[] = []
      
      if (userContext.monthlyIncome !== undefined) {
        contextParts.push(`Renda mensal: R$ ${userContext.monthlyIncome.toFixed(2)}`)
      }
      
      if (userContext.monthlyExpenses !== undefined) {
        contextParts.push(`Gastos mensais: R$ ${userContext.monthlyExpenses.toFixed(2)}`)
        
        if (userContext.monthlyIncome !== undefined && userContext.monthlyIncome > 0) {
          const savingsRate = ((userContext.monthlyIncome - userContext.monthlyExpenses) / userContext.monthlyIncome) * 100
          contextParts.push(`Taxa de poupança: ${savingsRate.toFixed(1)}%`)
        }
      }
      
      if (userContext.categories && userContext.categories.length > 0) {
        contextParts.push(`Categorias de gastos: ${userContext.categories.join(', ')}`)
      }
      
      if (userContext.recentTransactions && userContext.recentTransactions.length > 0) {
        contextParts.push(`Transações recentes: ${userContext.recentTransactions.length} transações`)
      }
      
      if (contextParts.length > 0) {
        contextInfo = `\n\nContexto financeiro do usuário:\n${contextParts.join('\n')}`
      }
    }

    const systemPrompt = `Você é um assistente financeiro pessoal especializado em ajudar pessoas a gerenciarem suas finanças. 

Sua missão é:
- Fornecer conselhos práticos e acionáveis sobre finanças pessoais
- Ajudar com planejamento de orçamento e economia
- Sugerir estratégias de investimento adequadas ao perfil do usuário
- Analisar padrões de gastos e identificar oportunidades de economia
- Responder perguntas sobre educação financeira de forma clara e acessível

Seja sempre positivo, encorajador e prático nas suas respostas. Use emojis ocasionalmente para tornar a conversa mais amigável.

Responda em português brasileiro de forma clara e concisa.`

    const userPrompt = `${message}${contextInfo}`

    const fullPrompt = `${systemPrompt}\n\nUsuário: ${userPrompt}\n\nAssistente:`

    const result = await model.generateContent(fullPrompt)

    const response = result.response
    const text = response.text()

    return text || 'Desculpe, não consegui gerar uma resposta. Tente novamente.'

  } catch (error: any) {
    console.error('Erro ao gerar resposta do chat:', error.message)
    
    // Fallback com resposta genérica
    return 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente em alguns instantes. Se o problema persistir, verifique se a API Gemini está configurada corretamente.'
  }
}
