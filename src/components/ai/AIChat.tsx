import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { geminiService } from '../../services/gemini'
import { useAuth } from '../../contexts/AuthContext'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatProps {
  onClose: () => void
  userContext?: {
    monthlyIncome: number
    monthlyExpenses: number
    categories: string[]
    recentTransactions: Array<{description: string, amount: number, category: string}>
  }
}

export default function AIChat({ onClose, userContext }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Olá! Sou seu assistente financeiro pessoal 🤖\n\nPosso ajudar você com:\n• Análise de gastos\n• Sugestões de economia\n• Planejamento de orçamento\n• Dicas de investimento\n\nComo posso ajudar suas finanças hoje?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Contexto padrão se não fornecido
      const context = userContext || {
        monthlyIncome: 5000,
        monthlyExpenses: 3500,
        categories: ['Alimentação', 'Transporte', 'Moradia'],
        recentTransactions: []
      }

      const response = await geminiService.chatWithAssistant(userMessage.content, context)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erro no chat:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const suggestedQuestions = [
    "Como posso economizar mais dinheiro?",
    "Estou gastando muito em alimentação?",
    "Qual a melhor forma de investir?",
    "Como fazer um orçamento mensal?"
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--white)',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '600px',
        height: '80vh',
        maxHeight: '700px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                color: 'var(--primary-dark)',
                fontSize: '1.25rem',
                fontWeight: '700'
              }}>
                Assistente Financeiro
              </h2>
              <p style={{
                margin: 0,
                color: 'var(--gray-500)',
                fontSize: '0.875rem'
              }}>
                Powered by Gemini AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '4px',
              color: 'var(--gray-500)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-100)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: message.type === 'user' ? 'var(--accent-orange)' : 'var(--primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {message.type === 'user' ? (
                  <User size={16} color="white" />
                ) : (
                  <Bot size={16} color="white" />
                )}
              </div>
              
              <div style={{
                maxWidth: '70%',
                backgroundColor: message.type === 'user' ? 'var(--accent-orange)' : 'var(--gray-100)',
                color: message.type === 'user' ? 'white' : 'var(--gray-900)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                wordWrap: 'break-word'
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  opacity: 0.7,
                  marginTop: '0.5rem'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bot size={16} color="white" />
              </div>
              <div style={{
                backgroundColor: 'var(--gray-100)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Loader2 size={16} className="animate-spin" />
                <span style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                  Pensando...
                </span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div style={{
            padding: '0 1rem 1rem 1rem'
          }}>
            <p style={{
              margin: '0 0 0.75rem 0',
              color: 'var(--gray-600)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Perguntas sugeridas:
            </p>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  style={{
                    backgroundColor: 'var(--gray-100)',
                    border: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: 'var(--gray-700)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-200)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-100)'
                  }}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid var(--gray-200)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta sobre finanças..."
            style={{
              flex: 1,
              minHeight: '40px',
              maxHeight: '120px',
              padding: '0.75rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: inputMessage.trim() && !isLoading ? 'var(--accent-orange)' : 'var(--gray-300)',
              border: 'none',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  )
}
