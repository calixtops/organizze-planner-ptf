import { useState, useEffect } from 'react'
import api, { groupsService, familyMembersService } from '../services/api'
import { DashboardData, Group, FamilyMember, Transaction, Installment } from '../types'
import { installmentsService } from '../services/api'
import BalanceCard from '../components/dashboard/BalanceCard'
import MonthlyTrendNew from '../components/dashboard/MonthlyTrendNew'
import CategoriesChartNew from '../components/dashboard/CategoriesChartNew'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import QuickExpenseModal from '../components/dashboard/QuickExpenseModal'
import MemberExpenses from '../components/dashboard/MemberExpenses'
import MonthlyExpensesTable from '../components/dashboard/MonthlyExpensesTable'
import ExpenseSummaryCard from '../components/dashboard/ExpenseSummaryCard'
import ExpenseDistribution from '../components/dashboard/ExpenseDistribution'
import InstallmentsStatus from '../components/dashboard/InstallmentsStatus'
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown'
import FinancialInsights from '../components/ai/FinancialInsights'
import LoadingSpinner from '../components/LoadingSpinner'
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
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [groupId, setGroupId] = useState<string>('')
  const [memberExpenses, setMemberExpenses] = useState<Array<{ member: string, amount: number }>>([])
  const [personalExpenses, setPersonalExpenses] = useState(0)
  const [monthlyExpenses, setMonthlyExpenses] = useState<Transaction[]>([])
  const [loadingMonthlyExpenses, setLoadingMonthlyExpenses] = useState(false)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [fixedExpenses, setFixedExpenses] = useState(0)
  const [variableExpenses, setVariableExpenses] = useState(0)
  const [installmentsExpenses, setInstallmentsExpenses] = useState(0)

  useEffect(() => {
    loadGroups()
    loadMembers()
  }, [])

  useEffect(() => {
    fetchDashboardData()
    loadMemberExpenses()
    loadPersonalExpenses()
    loadMonthlyExpenses()
    loadInstallments()
  }, [groupId])

  const loadGroups = async () => {
    try {
      const response = await groupsService.getAll()
      setGroups(response.data.groups || [])
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    } finally {
      fetchDashboardData()
    }
  }

  const loadMembers = async () => {
    try {
      const response = await familyMembersService.getAll()
      setMembers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
      setMembers([])
    }
  }

  const loadMemberExpenses = async () => {
    try {
      const params: any = {
        type: 'expense',
        isFamily: true, // Apenas gastos familiares entram nas KPIs por membro
        limit: 1000 // Buscar muitos para calcular os totais
      }

      const response = await api.get('/transactions', { params })
      const transactions = response.data.transactions || response.data || []
      
      // Agrupar gastos por membro (apenas familiares)
      const expensesByMember: Record<string, number> = {}
      transactions.forEach((t: any) => {
        if (t.paidBy && t.isFamily) {
          expensesByMember[t.paidBy] = (expensesByMember[t.paidBy] || 0) + t.amount
        }
      })

      const result = Object.entries(expensesByMember).map(([member, amount]) => ({
        member,
        amount
      })).sort((a, b) => b.amount - a.amount)

      setMemberExpenses(result)
    } catch (error) {
      console.error('Erro ao carregar gastos por membro:', error)
      setMemberExpenses([])
    }
  }

  const loadPersonalExpenses = async () => {
    try {
      const params: any = {
        type: 'expense',
        isFamily: false, // Apenas gastos pessoais
        limit: 1000
      }

      const response = await api.get('/transactions', { params })
      const transactions = response.data.transactions || response.data || []
      
      const total = transactions.reduce((sum: number, t: any) => sum + t.amount, 0)
      setPersonalExpenses(total)
    } catch (error) {
      console.error('Erro ao carregar gastos pessoais:', error)
      setPersonalExpenses(0)
    }
  }

  const loadMonthlyExpenses = async () => {
    try {
      setLoadingMonthlyExpenses(true)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      const params: any = {
        type: 'expense',
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        limit: 500, // Limite alto para pegar todos os gastos do mês
        sort: 'date' // Ordenar por data
      }

      const response = await api.get('/transactions', { params })
      const transactions = response.data.transactions || response.data || []
      
      // Ordenar por data (mais recente primeiro)
      const sorted = transactions.sort((a: Transaction, b: Transaction) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      setMonthlyExpenses(sorted)

      // Calcular totais por tipo
      const fixed = sorted
        .filter(t => t.nature === 'fixed' && !t.installmentInfo)
        .reduce((sum, t) => sum + t.amount, 0)
      
      const variable = sorted
        .filter(t => t.nature === 'variable')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const installments = sorted
        .filter(t => t.installmentInfo)
        .reduce((sum, t) => sum + t.amount, 0)

      setFixedExpenses(fixed)
      setVariableExpenses(variable)
      setInstallmentsExpenses(installments)
    } catch (error) {
      console.error('Erro ao carregar gastos mensais:', error)
      setMonthlyExpenses([])
      setFixedExpenses(0)
      setVariableExpenses(0)
      setInstallmentsExpenses(0)
    } finally {
      setLoadingMonthlyExpenses(false)
    }
  }

  const loadInstallments = async () => {
    try {
      const response = await installmentsService.getAll()
      setInstallments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar parcelamentos:', error)
      setInstallments([])
    }
  }

  const fetchDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // Tentar buscar dados da API
      try {
        const response = await api.get('/transactions/summary/dashboard', {
          params: groupId ? { groupId } : undefined
        })
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
    loadMemberExpenses()
    loadPersonalExpenses()
    loadMonthlyExpenses()
    loadInstallments()
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
        maxWidth: '1600px', 
        margin: '0 auto',
        width: '100%'
      }}>

        {/* Nova Seção: Análise Visual dos Gastos Mensais */}
        <div style={{ marginBottom: '3rem' }}>
          {/* Cards de Resumo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '28px',
            marginBottom: '3rem'
          }}>
            <ExpenseSummaryCard
              title="Gastos Fixos"
              amount={fixedExpenses}
              icon="🏠"
              color="#e67e22"
              subtitle="Gastos recorrentes do mês"
            />
            <ExpenseSummaryCard
              title="Gastos Correntes"
              amount={variableExpenses}
              icon="💸"
              color="#3498db"
              subtitle="Gastos variáveis do mês"
            />
            <ExpenseSummaryCard
              title="Parcelamentos"
              amount={installmentsExpenses}
              icon="💳"
              color="#9b59b6"
              subtitle="Parcelas pagas este mês"
            />
            <ExpenseSummaryCard
              title="Total de Gastos"
              amount={fixedExpenses + variableExpenses + installmentsExpenses}
              icon="📊"
              color="#e74c3c"
              subtitle="Soma de todos os gastos"
            />
          </div>

          {/* Grid de Análise Visual */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '28px',
            marginBottom: '3rem'
          }}>
            {/* Distribuição dos Gastos */}
            <ExpenseDistribution
              fixed={fixedExpenses}
              variable={variableExpenses}
              installments={installmentsExpenses}
            />

            {/* Status dos Parcelamentos */}
            <InstallmentsStatus installments={installments} />
          </div>

          {/* Breakdown por Categoria */}
          <CategoryBreakdown expenses={monthlyExpenses} members={members} />
        </div>

        {/* KPI de gastos por membro */}
        {memberExpenses.length > 0 && (
          <MemberExpenses 
            memberExpenses={memberExpenses}
            members={members}
            totalExpenses={memberExpenses.reduce((sum, me) => sum + me.amount, 0)}
          />
        )}

        {/* Seção de Gastos Pessoais */}
        {personalExpenses > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            marginTop: '32px',
            marginBottom: '32px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: 'bold', color: 'var(--gray-800)' }}>
              👤 Gastos Pessoais
            </h3>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '28px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px'
            }}>
              <span style={{ fontSize: '20px', fontWeight: '600', color: 'var(--gray-700)' }}>
                Total de Gastos Pessoais
              </span>
              <span style={{ fontSize: '40px', fontWeight: 'bold', color: '#e74c3c' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(personalExpenses)}
              </span>
            </div>
            <p style={{ marginTop: '20px', fontSize: '14px', color: 'var(--gray-500)', textAlign: 'center' }}>
              Gastos marcados como "Pessoal" não entram nas KPIs familiares
            </p>
          </div>
        )}

        {/* Tabela de Gastos Mensais */}
        <div style={{ marginTop: '32px', marginBottom: '32px' }}>
          <MonthlyExpensesTable 
            expenses={monthlyExpenses}
            members={members}
            loading={loadingMonthlyExpenses}
          />
        </div>

        {/* Transações recentes */}
        <RecentTransactions groupId={groupId || undefined} />
        
        {/* Insights Financeiros - Temporariamente desabilitado */}
        {/* <FinancialInsights /> */}
      </div>

      {/* Quick Expense Modal */}
      <QuickExpenseModal onExpenseAdded={handleTransactionAdded} />

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
