import { useState, useEffect } from 'react'
import api from '../services/api'
import { DashboardData } from '../types'
import BalanceCard from '../components/dashboard/BalanceCard'
import MonthlyTrendNew from '../components/dashboard/MonthlyTrendNew'
import CategoriesChartNew from '../components/dashboard/CategoriesChartNew'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import QuickExpenseForm from '../components/dashboard/QuickExpenseForm'
import FinancialInsights from '../components/ai/FinancialInsights'
import LoadingSpinner from '../components/LoadingSpinner'
import { RefreshCw, TrendingUp, TrendingDown, Bot, Sparkles, Upload } from 'lucide-react'
import AIChat from '../components/ai/AIChat'
import TransactionImporter from '../components/import/TransactionImporter'

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showImporter, setShowImporter] = useState(false)
  const [showIncomeForm, setShowIncomeForm] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // Tentar buscar dados da API
      try {
        const response = await api.get('/transactions/summary/dashboard')
        setData(response.data)
        setError('')
      } catch (apiError) {
        // Se a API falhar, mostrar erro
        console.log('API não disponível')
        setError('Não foi possível carregar os dados. Verifique sua conexão.')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  const handleTransactionAdded = () => {
    fetchDashboardData(true)
  }

  const handleClearAllTransactions = async () => {
    if (!window.confirm('Tem certeza que deseja apagar todas as transações? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      // Limpar no backend
      await api.delete('/transactions/clear-all')
      
      // Limpar localStorage também (fallback)
      localStorage.removeItem('importedTransactions')
      
      // Recarregar dados do dashboard
      await fetchDashboardData(true)
      
      alert('Todas as transações foram apagadas com sucesso!')
    } catch (error) {
      console.error('Erro ao limpar transações:', error)
      alert('Erro ao limpar transações. Tente novamente.')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem'
      }}>
        <LoadingSpinner />
        <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
          Carregando seus dados financeiros...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        textAlign: 'center',
        minHeight: '60vh'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <TrendingDown size={40} color="var(--error)" />
        </div>
        <h2 style={{ 
          color: 'var(--error)', 
          marginBottom: '1rem',
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          Erro ao carregar dashboard
        </h2>
        <p style={{ 
          color: 'var(--gray-600)', 
          marginBottom: '2rem',
          maxWidth: '400px',
          lineHeight: '1.6'
        }}>
          {error}
        </p>
        <button 
          onClick={() => fetchDashboardData()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--accent-orange)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e04a1f'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-orange)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        textAlign: 'center',
        minHeight: '60vh'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          <TrendingUp size={40} color="var(--gray-500)" />
        </div>
        <h2 style={{ 
          color: 'var(--gray-600)', 
          marginBottom: '1rem',
          fontSize: '1.5rem',
          fontWeight: '700'
        }}>
          Nenhum dado encontrado
        </h2>
        <p style={{ 
          color: 'var(--gray-500)',
          maxWidth: '400px',
          lineHeight: '1.6'
        }}>
          Adicione algumas transações para ver seu dashboard personalizado
        </p>
      </div>
    )
  }

  return (
    <>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* Header */}
        <div className="dashboard-header" style={{ 
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 className="dashboard-title" style={{
              color: 'var(--primary-dark)',
              fontSize: '2.5rem',
              fontWeight: '800',
              marginBottom: '0.5rem',
              background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--accent-orange) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Dashboard
            </h1>
            <p style={{
              color: 'var(--gray-600)',
              fontSize: '1.125rem',
              fontWeight: '500'
            }}>
              Visão geral das suas finanças
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowImporter(true)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--success)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--success)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Upload size={16} />
              Importar C6 Bank
            </button>
            
            <button
              onClick={() => setShowIncomeForm(true)}
              style={{
                backgroundColor: 'var(--success)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--success)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              💰 Adicionar Receita
            </button>
            
            <button
              onClick={handleClearAllTransactions}
              style={{
                backgroundColor: 'var(--error)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--error)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              🗑️ Limpar Transações
            </button>
            
            <button
              onClick={() => setShowAIChat(true)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--accent-orange)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e04a1f'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-orange)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Bot size={16} />
              Assistente IA
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--white)',
                color: 'var(--gray-600)',
                border: '2px solid var(--gray-200)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                opacity: refreshing ? 0.7 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!refreshing) {
                  e.currentTarget.style.borderColor = 'var(--accent-orange)'
                  e.currentTarget.style.color = 'var(--accent-orange)'
                }
              }}
              onMouseLeave={(e) => {
                if (!refreshing) {
                  e.currentTarget.style.borderColor = 'var(--gray-200)'
                  e.currentTarget.style.color = 'var(--gray-600)'
                }
              }}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>

        {/* Cards de resumo - Layout compacto */}
        <div className="balance-cards" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <BalanceCard
            title="Saldo Total"
            value={data.totalBalance}
            icon="💰"
            color="var(--primary-dark)"
          />
          <BalanceCard
            title="Receitas do Mês"
            value={data.monthlyIncome}
            icon="📈"
            color="var(--success)"
          />
          <BalanceCard
            title="Despesas do Mês"
            value={data.monthlyExpenses}
            icon="📉"
            color="var(--error)"
          />
          <BalanceCard
            title="Saldo do Mês"
            value={data.monthlyBalance}
            icon="⚖️"
            color={data.monthlyBalance >= 0 ? 'var(--success)' : 'var(--error)'}
          />
        </div>

        {/* Gráfico de Tendência Mensal - Destaque principal */}
        <div style={{
          backgroundColor: 'var(--white)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--gray-800)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📊 Tendência Mensal
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                margin: '0.25rem 0 0 0'
              }}>
                Evolução das suas finanças nos últimos 3 meses
              </p>
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--success)',
                  borderRadius: '2px'
                }}></div>
                Receitas
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--error)',
                  borderRadius: '2px'
                }}></div>
                Despesas
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: 'var(--primary-dark)',
                  borderRadius: '2px'
                }}></div>
                Saldo
              </div>
            </div>
          </div>
          <div style={{ height: '400px' }}>
            <MonthlyTrendNew data={data.monthlyTrend} />
          </div>
        </div>

        {/* Gráfico de Categorias */}
        <div style={{
          backgroundColor: 'var(--white)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid var(--gray-200)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--gray-800)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎯 Análise por Categorias
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--gray-600)',
                margin: '0.25rem 0 0 0'
              }}>
                Distribuição dos seus gastos e receitas por categoria
              </p>
            </div>
          </div>
          <div style={{ height: '400px' }}>
            <CategoriesChartNew 
              expensesData={data.categoriesBreakdown.expenses}
              incomeData={data.categoriesBreakdown.income}
            />
          </div>
        </div>

        {/* Transações recentes */}
        <RecentTransactions />
        
        {/* Insights Financeiros - Temporariamente desabilitado */}
        {/* <FinancialInsights /> */}
      </div>

      {/* Quick Expense Form */}
      <QuickExpenseForm onTransactionAdded={handleTransactionAdded} />

      {/* AI Chat Modal */}
      {showAIChat && (
        <AIChat
          onClose={() => setShowAIChat(false)}
          userContext={data ? {
            monthlyIncome: data.monthlyIncome,
            monthlyExpenses: data.monthlyExpenses,
            categories: [
              ...data.categoriesBreakdown.expenses.map(c => c._id),
              ...data.categoriesBreakdown.income.map(c => c._id)
            ],
            recentTransactions: [] // TODO: Buscar transações recentes
          } : undefined}
        />
      )}

      {/* Transaction Importer Modal */}
      {showImporter && (
        <TransactionImporter
          onClose={() => setShowImporter(false)}
          onImportComplete={(count) => {
            setShowImporter(false)
            handleRefresh() // Atualizar dados após importação
          }}
        />
      )}

      {/* Income Form Modal */}
      {showIncomeForm && (
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
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--gray-700)' }}>
              💰 Adicionar Receita
            </h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const description = formData.get('description') as string
              const amount = formData.get('amount') as string
              const category = formData.get('category') as string
              
              try {
                await api.post('/transactions', {
                  description,
                  amount: parseFloat(amount),
                  type: 'income',
                  category,
                  status: 'paid',
                  date: new Date().toISOString(),
                  accountId: 'default-account'
                })
                
                setShowIncomeForm(false)
                await fetchDashboardData(true)
                alert('Receita adicionada com sucesso!')
              } catch (error) {
                console.error('Erro ao adicionar receita:', error)
                alert('Erro ao adicionar receita. Tente novamente.')
              }
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Descrição
                </label>
                <input
                  type="text"
                  name="description"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  placeholder="Ex: Salário, Freelance, Vendas..."
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Valor
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  placeholder="0.00"
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Categoria
                </label>
                <select
                  name="category"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Salário">Salário</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Investimentos">Investimentos</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Bônus">Bônus</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowIncomeForm(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: '8px',
                    backgroundColor: 'var(--white)',
                    color: 'var(--gray-700)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: 'var(--success)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Adicionar Receita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  )
}
