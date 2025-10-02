import OpenAI from 'openai'
import Transaction from '../models/Transaction.js'

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY não definida. Funcionalidade de IA será desabilitada.')
}

const openai = process.env.OPENAI_API_KEY ? new (OpenAI as any)({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

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
 * Gera sugestão de categoria usando OpenAI
 */
async function generateCategorySuggestion(
  description: string,
  amount: number,
  type: 'income' | 'expense',
  similarTransactions: any[]
): Promise<AISuggestion> {
  if (!openai) {
    // Fallback para categorias padrão se OpenAI não estiver configurada
    const categories = DEFAULT_CATEGORIES[type]
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    
    return {
      category: randomCategory,
      confidence: 0.5,
      explanation: 'Categoria sugerida automaticamente (OpenAI não configurada)'
    }
  }

  try {
    // Preparar contexto das transações similares
    const contextTransactions = similarTransactions
      .slice(0, 3) // Usar apenas as 3 mais similares
      .map(t => `"${t.description}" -> ${t.category}`)
      .join('\n')

    const systemPrompt = `Você é um assistente especializado em categorização de transações financeiras pessoais.

Categorias disponíveis para ${type === 'income' ? 'RECEITAS' : 'DESPESAS'}:
${type === 'income' ? DEFAULT_CATEGORIES.income.join(', ') : DEFAULT_CATEGORIES.expense.join(', ')}

Suas tarefas:
1. Analisar a descrição da transação
2. Considerar o valor da transação (pode ajudar a determinar a categoria)
3. Usar as transações similares como referência
4. Sugerir a categoria mais apropriada
5. Explicar brevemente o motivo da escolha
6. Dar uma pontuação de confiança de 0 a 1

Responda APENAS em formato JSON válido:
{
  "category": "Nome da categoria",
  "confidence": 0.95,
  "explanation": "Explicação breve do motivo"
}`

    const userPrompt = `Transação para categorizar:
Descrição: "${description}"
Valor: R$ ${amount.toFixed(2)}
Tipo: ${type === 'income' ? 'Receita' : 'Despesa'}

Transações similares do usuário:
${contextTransactions || 'Nenhuma transação similar encontrada'}`

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Resposta vazia da OpenAI')
    }

    // Tentar fazer parse do JSON
    let suggestion: AISuggestion
    try {
      suggestion = JSON.parse(response)
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta da OpenAI:', response)
      throw new Error('Resposta inválida da OpenAI')
    }

    // Validar resposta
    if (!suggestion.category || typeof suggestion.confidence !== 'number' || !suggestion.explanation) {
      throw new Error('Formato de resposta inválido da OpenAI')
    }

    // Garantir que a confiança esteja entre 0 e 1
    suggestion.confidence = Math.max(0, Math.min(1, suggestion.confidence))

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
