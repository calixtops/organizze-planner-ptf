import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Lightbulb, Target, DollarSign, Sparkles } from 'lucide-react'
import { geminiService } from '../../services/gemini'
import api from '../../services/api'
import LoadingSpinner from '../LoadingSpinner'

interface Transaction {
  description: string
  amount: number
  category: string
  date: string
}

interface Insight {
  type: 'positive' | 'negative' | 'neutral'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

interface SpendingAnalysis {
  insights: string[]
  recommendations: string[]
  trends: string
}

interface SavingsOpportunities {
  opportunities: Array<{
    type: string
    description: string
    potentialSavings: number
    action: string
  }>
  totalPotentialSavings: number
}

export default function FinancialInsights() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [analysis, setAnalysis] = useState<SpendingAnalysis | null>(null)
  const [savings, setSavings] = useState<SavingsOpportunities | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDataAndAnalyze()
  }, [])

  const fetchDataAndAnalyze = async () => {
    try {
      setLoading(true)
      setError('')

      // Buscar transações recentes
      const response = await api.get('/transactions?limit=50&page=1')
      const recentTransactions = response.data.transactions || []
      
      setTransactions(recentTransactions)

      // Análise de padrões de gastos
      const spendingAnalysis = await geminiService.analyzeSpendingPatterns(recentTransactions)
      setAnalysis(spendingAnalysis)

      // Oportunidades de economia
      const savingsOpportunities = await geminiService.findSavingsOpportunities(recentTransactions)
      setSavings(savingsOpportunities)

    } catch (err: any) {
      console.error('Erro ao analisar dados:', err)
      setError('Erro ao carregar insights financeiros')
    } finally {
      setLoading(false)
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'var(--error)'
      case 'medium': return 'var(--warning)'
      case 'low': return 'var(--success)'
      default: return 'var(--gray-500)'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <TrendingDown size={16} />
      case 'medium': return <Target size={16} />
      case 'low': return <TrendingUp size={16} />
      default: return <Lightbulb size={16} />
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem'
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
            <Sparkles size={20} color="white" />
          </div>
          <h3 style={{
            color: 'var(--primary-dark)',
            fontSize: '1.125rem',
            fontWeight: '700',
            margin: 0
          }}>
            Insights Financeiros
          </h3>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <LoadingSpinner message="Analisando seus dados financeiros..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            backgroundColor: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingDown size={20} color="white" />
          </div>
          <h3 style={{
            color: 'var(--primary-dark)',
            fontSize: '1.125rem',
            fontWeight: '700',
            margin: 0
          }}>
            Insights Financeiros
          </h3>
        </div>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--error)'
        }}>
          <p>{error}</p>
          <button
            onClick={fetchDataAndAnalyze}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
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
            <Sparkles size={20} color="white" />
          </div>
          <h3 style={{
            color: 'var(--primary-dark)',
            fontSize: '1.125rem',
            fontWeight: '700',
            margin: 0
          }}>
            Insights Financeiros
          </h3>
        </div>
        <button
          onClick={fetchDataAndAnalyze}
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem'
          }}
        >
          Atualizar
        </button>
      </div>

      {/* Análise de Tendências */}
      {analysis && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{
            color: 'var(--gray-700)',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <TrendingUp size={16} />
            Tendências Identificadas
          </h4>
          <div style={{
            backgroundColor: 'var(--gray-50)',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--gray-200)'
          }}>
            <p style={{
              margin: 0,
              color: 'var(--gray-700)',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              {analysis.trends}
            </p>
          </div>
        </div>
      )}

      {/* Insights */}
      {analysis && analysis.insights.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{
            color: 'var(--gray-700)',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Lightbulb size={16} />
            Principais Insights
          </h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {analysis.insights.map((insight, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '8px',
                  border: '1px solid var(--gray-200)'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '0.125rem'
                }}>
                  <span style={{
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {index + 1}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  color: 'var(--gray-700)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5'
                }}>
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendações */}
      {analysis && analysis.recommendations.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{
            color: 'var(--gray-700)',
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Target size={16} />
            Recomendações
          </h4>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {analysis.recommendations.map((recommendation, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--info)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '0.125rem'
                }}>
                  <span style={{
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {index + 1}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  color: 'var(--gray-700)',
                  fontSize: '0.875rem',
                  lineHeight: '1.5'
                }}>
                  {recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Oportunidades de Economia */}
      {savings && savings.opportunities && savings.opportunities.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h4 style={{
              color: 'var(--gray-700)',
              fontSize: '1rem',
              fontWeight: '600',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <DollarSign size={16} />
              Oportunidades de Economia
            </h4>
            <div style={{
              backgroundColor: 'var(--success)',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              +R$ {savings.totalPotentialSavings.toFixed(2)}
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {savings.opportunities.map((opportunity, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <h5 style={{
                    margin: 0,
                    color: 'var(--gray-800)',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    {opportunity.type}
                  </h5>
                  <span style={{
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    R$ {opportunity.potentialSavings.toFixed(2)}
                  </span>
                </div>
                <p style={{
                  margin: '0 0 0.5rem 0',
                  color: 'var(--gray-700)',
                  fontSize: '0.875rem'
                }}>
                  {opportunity.description}
                </p>
                <p style={{
                  margin: 0,
                  color: 'var(--success)',
                  fontSize: '0.8125rem',
                  fontWeight: '500'
                }}>
                  💡 {opportunity.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!analysis || analysis.insights.length === 0) && (!savings || savings.opportunities.length === 0) && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: 'var(--gray-500)'
        }}>
          <Sparkles size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p>Adicione mais transações para receber insights personalizados!</p>
        </div>
      )}
    </div>
  )
}
