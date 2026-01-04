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
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      marginTop: '32px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{
          color: 'var(--primary-dark)',
          fontSize: '1.5rem',
          fontWeight: '700',
          margin: 0
        }}>
          💳 Transações Recentes
        </h3>
        <button
          onClick={() => navigate('/transactions')}
          style={{
            padding: '10px 20px',
            fontSize: '0.9375rem',
            fontWeight: '600',
            backgroundColor: 'var(--accent-orange)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
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
          Ver todas →
        </button>
      </div>

      {transactions.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2rem',
          color: 'var(--gray-500)',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          border: '2px dashed #dee2e6'
        }}>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '1rem' }}>
            Nenhuma transação encontrada
          </p>
          <button
            onClick={() => navigate('/transactions')}
            style={{
              padding: '12px 24px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e67e22'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-orange)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Adicionar primeira transação
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {transactions.map((transaction) => (
            <div
              key={transaction._id}
              onClick={() => navigate('/transactions')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f7ff'
                e.currentTarget.style.borderColor = 'var(--accent-orange)'
                e.currentTarget.style.transform = 'translateX(4px)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa'
                e.currentTarget.style.borderColor = '#e9ecef'
                e.currentTarget.style.transform = 'translateX(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flex: 1
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: transaction.type === 'income' ? '#d4edda' : '#f8d7da',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getTransactionIcon(transaction.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: '0 0 6px 0',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#2c3e50'
                  }}>
                    {transaction.description}
                  </p>
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
                      {transaction.category}
                    </span>
                    {transaction.accountId && (
                      <span style={{
                        fontSize: '0.8125rem',
                        color: '#666'
                      }}>
                        💳 {transaction.accountId.name}
                      </span>
                    )}
                    {transaction.creditCardId && (
                      <span style={{
                        fontSize: '0.8125rem',
                        color: '#666'
                      }}>
                        🏦 {transaction.creditCardId.name}
                      </span>
                    )}
                    {transaction.nature && (
                      <span style={{
                        fontSize: '0.8125rem',
                        color: '#666',
                        padding: '4px 10px',
                        backgroundColor: transaction.nature === 'fixed' ? '#fff3cd' : '#e7f3ff',
                        borderRadius: '6px'
                      }}>
                        {transaction.nature === 'fixed' ? '🏠 Fixo' : '💸 Variável'}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.8125rem',
                      color: '#999'
                    }}>
                      📅 {formatDate(transaction.date)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '4px',
                marginLeft: '16px'
              }}>
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: getTransactionColor(transaction.type)
                }}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
