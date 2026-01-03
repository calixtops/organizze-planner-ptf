import { aiService } from './api'

type Tx = {
  description: string
  amount: number
  category: string
  date: string
}

class GeminiService {
  async categorizeTransaction(description: string, amount: number, type: 'income' | 'expense' = 'expense') {
    try {
      const response = await aiService.suggestCategory(description, amount, type)
      return response.data.suggestion
    } catch (error) {
      console.error('Erro ao categorizar transação:', error)
      return {
        category: 'Outros',
        confidence: 0,
        explanation: 'Erro ao categorizar transação.'
      }
    }
  }

  async analyzeSpendingPatterns(_transactions: Tx[]) {
    // TODO: Implementar análise de padrões de gastos no backend
    return {
      insights: [],
      recommendations: [],
      trends: 'Análise em desenvolvimento'
    }
  }

  async findSavingsOpportunities(_transactions: Tx[]) {
    // TODO: Implementar oportunidades de economia no backend
    return {
      opportunities: [],
      totalPotentialSavings: 0
    }
  }

  async chatWithAssistant(message: string, userContext?: any) {
    try {
      const response = await aiService.chat(message, userContext)
      return response.data.response
    } catch (error: any) {
      console.error('Erro ao conversar com assistente:', error)
      return 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente em alguns instantes.'
    }
  }
}

export const geminiService = new GeminiService()
export default geminiService
