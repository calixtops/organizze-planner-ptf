import { useState, useEffect } from 'react'
import api, { groupsService } from '../services/api'
import { Transaction, Account, CreditCard, Group } from '../types'
import TransactionForm from '../components/transactions/TransactionForm'
import TransactionTable from '../components/transactions/TransactionTable'
import TransactionFilters from '../components/transactions/TransactionFilters'
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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<PopulatedTransaction | null>(null)
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: '',
    nature: '',
    category: '',
    status: '',
    accountId: '',
    creditCardId: '',
    groupId: '',
    startDate: '',
    endDate: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchData()
  }, [filters])

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await groupsService.getAll()
        setGroups(response.data.groups || [])
      } catch (error) {
        console.error('Erro ao carregar grupos:', error)
      }
    }
    loadGroups()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [transactionsRes, accountsRes, creditCardsRes] = await Promise.allSettled([
        api.get('/transactions', { params: filters }),
        api.get('/accounts'),
        api.get('/credit-cards')
      ])
      
      // Processar resultados com fallback para arrays vazios
      const transactionsData = transactionsRes.status === 'fulfilled' ? transactionsRes.value.data : []
      const accountsData = accountsRes.status === 'fulfilled' ? accountsRes.value.data : []
      const creditCardsData = creditCardsRes.status === 'fulfilled' ? creditCardsRes.value.data : []
      
      setTransactions(transactionsData.transactions || transactionsData)
      setPagination(transactionsData.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
      setAccounts(accountsData.accounts || accountsData)
      setCreditCards(creditCardsData.creditCards || creditCardsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionCreated = (transaction: PopulatedTransaction) => {
    setTransactions(prev => [transaction, ...prev.slice(0, -1)])
    setShowForm(false)
  }

  const handleTransactionUpdated = (updatedTransaction: PopulatedTransaction) => {
    setTransactions(prev => 
      prev.map(t => t._id === updatedTransaction._id ? updatedTransaction : t)
    )
    setEditingTransaction(null)
  }

  const handleTransactionDeleted = (transactionId: string) => {
    setTransactions(prev => prev.filter(t => t._id !== transactionId))
  }

  const handleEdit = (transaction: PopulatedTransaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  if (loading && transactions.length === 0) {
    return <LoadingSpinner message="Carregando transações..." />
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div>
            <h1 style={{
              color: 'var(--primary-dark)',
              fontSize: '2rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
              margin: 0
            }}>
              Transações
            </h1>
            <p style={{
              color: 'var(--gray-600)',
              fontSize: '1rem',
              margin: 0
            }}>
              Gerencie suas receitas e despesas
            </p>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            Nova Transação
          </button>
        </div>

        <TransactionFilters
          filters={filters}
          accounts={accounts}
          creditCards={creditCards}
          groups={groups}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      <TransactionTable
        transactions={transactions}
        onEdit={handleEdit}
        onDelete={handleTransactionDeleted}
        pagination={pagination}
        onPageChange={handlePageChange}
        loading={loading}
        groupMap={Object.fromEntries(groups.map(g => [g._id, g.name]))}
      />

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          accounts={accounts}
          creditCards={creditCards}
          groups={groups}
          onSuccess={editingTransaction ? handleTransactionUpdated : handleTransactionCreated}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}
