import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { Transaction, Account, CreditCard } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface PopulatedTransaction extends Omit<Transaction, 'accountId' | 'creditCardId'> {
  accountId?: Account
  creditCardId?: CreditCard
}

interface Props {
  groupId?: string
}

export default function RecentTransactions({ groupId }: Props) {
  const [transactions, setTransactions] = useState<PopulatedTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchRecentTransactions()
  }, [groupId])

  const fetchRecentTransactions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/transactions', { params: { limit: 5, page: 1, groupId } })
      setTransactions(response.data.transactions)
    } catch (error) {
      console.error('Erro ao carregar transações recentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: 'income' | 'expense') => {
    return type === 'income' ? (
      <TrendingUp size={16} color="var(--success)" />
    ) : (
      <TrendingDown size={16} color="var(--error)" />
    )
  }

  const getTransactionColor = (type: 'income' | 'expense') => {
    return type === 'income' ? 'var(--success)' : 'var(--error)'
  }

  if (loading) {
    return (
      <div className="card">
        <h3 style={{
          color: 'var(--primary-dark)',
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1.5rem',
          margin: 0
        }}>
          Transações Recentes
        </h3>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="loading"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          color: 'var(--primary-dark)',
          fontSize: '1.125rem',
          fontWeight: '600',
          margin: 0
        }}>
          Transações Recentes
        </h3>
        <button
          onClick={() => navigate('/transactions')}
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '0.875rem'
          }}
        >
          Ver todas
        </button>
      </div>

      {transactions.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: 'var(--gray-500)',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 1rem 0' }}>
            Nenhuma transação encontrada
          </p>
          <button
            onClick={() => navigate('/transactions')}
            className="btn btn-primary"
          >
            Adicionar primeira transação
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {transactions.map((transaction) => (
            <div
              key={transaction._id}
              onClick={() => navigate('/transactions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: 'var(--gray-50)',
                border: '1px solid var(--gray-200)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-100)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-50)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flex: 1
              }}>
                {getTransactionIcon(transaction.type)}
                <div>
                  <p style={{
                    margin: '0 0 0.25rem 0',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: 'var(--gray-900)'
                  }}>
                    {transaction.description}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: 'var(--gray-600)'
                  }}>
                    {transaction.category}
                    {transaction.accountId && ` • ${transaction.accountId.name}`}
                    {transaction.creditCardId && ` • ${transaction.creditCardId.name}`}
                    {transaction.nature && ` • ${transaction.nature === 'fixed' ? 'Fixo' : 'Variável'}`}
                    {transaction.groupId && ' • Grupo'}
                  </p>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.25rem'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: getTransactionColor(transaction.type)
                }}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--gray-500)'
                }}>
                  {formatDate(transaction.date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
