import { useState, useEffect, useMemo } from 'react'
import { Plus, Filter, X, TrendingUp, TrendingDown, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import api, { groupsService, accountsService, creditCardsService, familyMembersService } from '../services/api'
import { Transaction, Account, CreditCard, Group, FamilyMember } from '../types'
import { formatCurrency, formatDate } from '../utils/format'
import TransactionForm from '../components/transactions/TransactionForm'
import QuickExpenseModal from '../components/dashboard/QuickExpenseModal'
import LoadingSpinner from '../components/LoadingSpinner'

interface PopulatedTransaction extends Omit<Transaction, 'accountId' | 'creditCardId'> {
  accountId?: Account
  creditCardId?: CreditCard
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<PopulatedTransaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showQuickExpenseModal, setShowQuickExpenseModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<PopulatedTransaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [filters, setFilters] = useState({
    page: 1,
    limit: 30,
    type: '',
    nature: '',
    category: '',
    status: '',
    accountId: '',
    creditCardId: '',
    isFamily: '',
    paidBy: '',
    startDate: '',
    endDate: ''
  })
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 30,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [filters])

  const loadInitialData = async () => {
    try {
      const [groupsRes, accountsRes, creditCardsRes, membersRes] = await Promise.allSettled([
        groupsService.getAll(),
        accountsService.getAll(),
        creditCardsService.getAll(),
        familyMembersService.getAll()
      ])

      if (groupsRes.status === 'fulfilled') {
        const groupsData = groupsRes.value.data
        setGroups(Array.isArray(groupsData) ? groupsData : (groupsData?.groups || []))
      }
      if (accountsRes.status === 'fulfilled') {
        const accountsData = accountsRes.value.data
        setAccounts(Array.isArray(accountsData) ? accountsData : (accountsData?.accounts || []))
      }
      if (creditCardsRes.status === 'fulfilled') {
        const creditCardsData = creditCardsRes.value.data
        setCreditCards(Array.isArray(creditCardsData) ? creditCardsData : (creditCardsData?.creditCards || []))
      }
      if (membersRes.status === 'fulfilled') {
        const membersData = membersRes.value.data
        setMembers(Array.isArray(membersData) ? membersData : (membersData?.members || []))
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
      // Garantir que sempre sejam arrays mesmo em caso de erro
      setAccounts([])
      setCreditCards([])
      setGroups([])
      setMembers([])
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params: any = { ...filters }
      
      // Limpar filtros vazios
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })

      const response = await api.get('/transactions', { params })
      const data = response.data
      
      setTransactions(data.transactions || data || [])
      setPagination(data.pagination || { 
        page: filters.page, 
        limit: filters.limit, 
        total: data.transactions?.length || 0, 
        pages: 1 
      })
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (transaction: PopulatedTransaction) => {
    if (!confirm(`Tem certeza que deseja excluir a transação "${transaction.description}"?`)) {
      return
    }

    try {
      setDeletingId(transaction._id)
      await api.delete(`/transactions/${transaction._id}`)
      setTransactions(prev => prev.filter(t => t._id !== transaction._id))
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      alert('Erro ao excluir transação. Tente novamente.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (transaction: PopulatedTransaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  const handleTransactionSaved = () => {
    fetchTransactions()
    handleCloseForm()
  }

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 30,
      type: '',
      nature: '',
      category: '',
      status: '',
      accountId: '',
      creditCardId: '',
      isFamily: '',
      paidBy: '',
      startDate: '',
      endDate: ''
    })
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getTransactionIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? (
      <TrendingUp size={20} color="#28a745" />
    ) : (
      <TrendingDown size={20} color="#dc3545" />
    )
  }

  const getTransactionColor = (type: 'income' | 'expense') => {
    return type === 'income' ? '#28a745' : '#dc3545'
  }

  const getMemberColor = (memberName: string) => {
    return members.find(m => m.name === memberName)?.color || '#95a5a6'
  }

  // Calcular totais
  const totals = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return { income, expense, balance: income - expense }
  }, [transactions])

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      // Excluir page e limit da contagem
      if (key === 'page' || key === 'limit') return false
      // Contar apenas valores não vazios
      return value !== '' && value !== null && value !== undefined
    }).length
  }, [filters])

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            color: 'var(--primary-dark)',
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '0.5rem',
            margin: 0
          }}>
            💳 Transações
          </h1>
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '1.125rem',
            margin: 0
          }}>
            Gerencie todas as suas receitas e despesas
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '12px 20px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              backgroundColor: showFilters ? 'var(--accent-orange)' : 'white',
              color: showFilters ? 'white' : 'var(--gray-700)',
              border: '2px solid var(--accent-orange)',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!showFilters) {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
              }
            }}
            onMouseLeave={(e) => {
              if (!showFilters) {
                e.currentTarget.style.backgroundColor = 'white'
              }
            }}
          >
            <Filter size={18} />
            Filtros
            {activeFiltersCount > 0 && (
              <span style={{
                backgroundColor: showFilters ? 'rgba(255,255,255,0.3)' : 'var(--accent-orange)',
                color: showFilters ? 'white' : 'white',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowQuickExpenseModal(true)}
            style={{
              padding: '12px 24px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e67e22'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(230, 126, 34, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-orange)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Plus size={18} />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '2px solid #d4edda'
        }}>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
            Receitas
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
            {formatCurrency(totals.income)}
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: '2px solid #f8d7da'
        }}>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
            Despesas
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>
            {formatCurrency(totals.expense)}
          </div>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          border: `2px solid ${totals.balance >= 0 ? '#d4edda' : '#f8d7da'}`
        }}>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
            Saldo
          </div>
          <div style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: totals.balance >= 0 ? '#28a745' : '#dc3545' 
          }}>
            {formatCurrency(totals.balance)}
          </div>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Filtros</h3>
              {activeFiltersCount > 0 && (
                <span style={{
                  padding: '4px 12px',
                  backgroundColor: 'var(--accent-orange)',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e9ecef'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                >
                  Limpar Filtros
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Badges de Filtros Ativos */}
          {activeFiltersCount > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              {filters.type && (
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Tipo: {filters.type === 'income' ? 'Receita' : 'Despesa'}
                  <button
                    onClick={() => handleFilterChange('type', '')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.nature && (
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Natureza: {filters.nature === 'fixed' ? 'Fixo' : 'Variável'}
                  <button
                    onClick={() => handleFilterChange('nature', '')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.category && (
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Categoria: {filters.category}
                  <button
                    onClick={() => handleFilterChange('category', '')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.status && (
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Status: {filters.status === 'paid' ? 'Pago' : 'Pendente'}
                  <button
                    onClick={() => handleFilterChange('status', '')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.isFamily && (
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {filters.isFamily === 'true' ? '👨‍👩‍👧‍👦 Familiar' : '👤 Pessoal'}
                  <button
                    onClick={() => handleFilterChange('isFamily', '')}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
              {(filters.startDate || filters.endDate) && (
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '16px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  📅 {filters.startDate && filters.endDate 
                    ? `${filters.startDate} até ${filters.endDate}`
                    : filters.startDate 
                    ? `A partir de ${filters.startDate}`
                    : `Até ${filters.endDate}`}
                  <button
                    onClick={() => {
                      handleFilterChange('startDate', '')
                      handleFilterChange('endDate', '')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: '#666'
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Todos</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Natureza
              </label>
              <select
                value={filters.nature}
                onChange={(e) => handleFilterChange('nature', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Todas</option>
                <option value="fixed">Fixo</option>
                <option value="variable">Variável</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Categoria
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Todas</option>
                {(filters.type === 'income' || !filters.type) && (
                  <optgroup label="Receitas">
                    <option value="Salário">Salário</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Investimentos">Investimentos</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Bônus">Bônus</option>
                    <option value="Outros">Outros</option>
                  </optgroup>
                )}
                {(filters.type === 'expense' || !filters.type) && (
                  <optgroup label="Despesas">
                    <option value="Alimentação">Alimentação</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Moradia">Moradia</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Educação">Educação</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Compras">Compras</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Assinaturas">Assinaturas</option>
                    <option value="Outros">Outros</option>
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Todos</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Todos</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Conta
              </label>
              <select
                value={filters.accountId}
                onChange={(e) => handleFilterChange('accountId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Todas</option>
                {Array.isArray(accounts) && accounts.map(account => (
                  <option key={account._id} value={account._id}>{account.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Cartão
              </label>
              <select
                value={filters.creditCardId}
                onChange={(e) => handleFilterChange('creditCardId', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Todos</option>
                {Array.isArray(creditCards) && creditCards.map(card => (
                  <option key={card._id} value={card._id}>{card.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Tipo de Gasto
              </label>
              <select
                value={filters.isFamily}
                onChange={(e) => handleFilterChange('isFamily', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              >
                <option value="">Todos</option>
                <option value="true">Familiar</option>
                <option value="false">Pessoal</option>
              </select>
            </div>

            {filters.isFamily === 'true' && (
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                  Pago por
                </label>
                <select
                  value={filters.paidBy}
                  onChange={(e) => handleFilterChange('paidBy', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '0.9375rem'
                  }}
                >
                  <option value="">Todos</option>
                  {Array.isArray(members) && members.map(member => (
                    <option key={member._id} value={member.name}>{member.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Data Inicial
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: '600' }}>
                Data Final
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  fontSize: '0.9375rem'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lista de Transações */}
      {loading && transactions.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <LoadingSpinner message="Carregando transações..." />
        </div>
      ) : transactions.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '4rem',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '1.125rem', color: '#666', marginBottom: '1.5rem' }}>
            Nenhuma transação encontrada
          </p>
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '12px 24px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            Adicionar primeira transação
          </button>
        </div>
      ) : (
        <>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                style={{
                  padding: '20px',
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: transaction.type === 'income' ? '#d4edda' : '#f8d7da',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '1.0625rem',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '8px'
                    }}>
                      {transaction.description}
                      {transaction.installmentInfo && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#fff3cd',
                          color: '#856404',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          Parcela {transaction.installmentInfo.current}/{transaction.installmentInfo.total}
                        </span>
                      )}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        fontSize: '0.8125rem',
                        color: '#666',
                        padding: '4px 10px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '6px'
                      }}>
                        {transaction.category || 'Sem categoria'}
                      </span>
                      
                      {transaction.accountId && (
                        <span style={{ fontSize: '0.8125rem', color: '#666' }}>
                          💳 {transaction.accountId.name}
                        </span>
                      )}
                      
                      {transaction.creditCardId && (
                        <span style={{ fontSize: '0.8125rem', color: '#666' }}>
                          🏦 {transaction.creditCardId.name}
                        </span>
                      )}
                      
                      {transaction.nature && (
                        <span style={{
                          fontSize: '0.8125rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: transaction.nature === 'fixed' ? '#fff3cd' : '#e7f3ff',
                          color: transaction.nature === 'fixed' ? '#856404' : '#004085'
                        }}>
                          {transaction.nature === 'fixed' ? '🏠 Fixo' : '💸 Variável'}
                        </span>
                      )}
                      
                      {transaction.isFamily && (
                        <span style={{
                          fontSize: '0.8125rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#d1ecf1',
                          color: '#0c5460'
                        }}>
                          👨‍👩‍👧‍👦 Familiar
                        </span>
                      )}
                      
                      {transaction.paidBy && transaction.isFamily && (
                        <span style={{
                          fontSize: '0.8125rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: getMemberColor(transaction.paidBy),
                          color: 'white'
                        }}>
                          Pago por: {transaction.paidBy}
                        </span>
                      )}
                      
                      <span style={{ fontSize: '0.8125rem', color: '#999' }}>
                        📅 {formatDate(transaction.date)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    marginRight: '8px'
                  }}>
                    <span style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: getTransactionColor(transaction.type)
                    }}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(transaction)}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e7f3ff'
                        e.currentTarget.style.borderColor = '#3498db'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.borderColor = '#dee2e6'
                      }}
                    >
                      <Edit size={16} color="#3498db" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(transaction)}
                      disabled={deletingId === transaction._id}
                      style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        cursor: deletingId === transaction._id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: deletingId === transaction._id ? 0.5 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (deletingId !== transaction._id) {
                          e.currentTarget.style.backgroundColor = '#f8d7da'
                          e.currentTarget.style.borderColor = '#dc3545'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (deletingId !== transaction._id) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.borderColor = '#dee2e6'
                        }
                      }}
                    >
                      <Trash2 size={16} color="#dc3545" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {pagination.pages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '2rem',
              padding: '20px'
            }}>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{
                  padding: '10px 16px',
                  backgroundColor: pagination.page === 1 ? '#f8f9fa' : 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: pagination.page === 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={18} />
                Anterior
              </button>
              
              <span style={{
                padding: '10px 20px',
                backgroundColor: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: '600'
              }}>
                Página {pagination.page} de {pagination.pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                style={{
                  padding: '10px 16px',
                  backgroundColor: pagination.page === pagination.pages ? '#f8f9fa' : 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: pagination.page === pagination.pages ? 0.5 : 1
                }}
              >
                Próxima
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Quick Expense Modal */}
      <QuickExpenseModal 
        isOpen={showQuickExpenseModal}
        onClose={() => setShowQuickExpenseModal(false)}
        onExpenseAdded={handleTransactionSaved}
      />

      {/* Modal de Formulário */}
      {showForm && (
        <TransactionForm
          transaction={editingTransaction ? {
            ...editingTransaction,
            accountId: editingTransaction.accountId ? { _id: editingTransaction.accountId } as any : undefined,
            creditCardId: editingTransaction.creditCardId ? { _id: editingTransaction.creditCardId } as any : undefined
          } : undefined}
          accounts={accounts}
          creditCards={creditCards}
          groups={groups}
          onSuccess={handleTransactionSaved}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}
