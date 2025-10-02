import { useState } from 'react'
import { Transaction, Account, CreditCard } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import { TrendingUp, TrendingDown, Edit, Trash2 } from 'lucide-react'
import LoadingSpinner from '../LoadingSpinner'

interface PopulatedTransaction extends Omit<Transaction, 'accountId' | 'creditCardId'> {
  accountId?: Account
  creditCardId?: CreditCard
}

interface TransactionTableProps {
  transactions: PopulatedTransaction[]
  onEdit: (transaction: PopulatedTransaction) => void
  onDelete: (transactionId: string) => void
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  onPageChange: (page: number) => void
  loading: boolean
}

export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
  loading
}: TransactionTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (transaction: PopulatedTransaction) => {
    if (!confirm(`Tem certeza que deseja excluir a transação "${transaction.description}"?`)) {
      return
    }

    try {
      setDeletingId(transaction._id)
      await fetch(`/api/transactions/${transaction._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      onDelete(transaction._id)
    } catch (error) {
      console.error('Erro ao deletar transação:', error)
      alert('Erro ao deletar transação')
    } finally {
      setDeletingId(null)
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

  const getStatusBadge = (status: 'paid' | 'pending') => {
    const styles = {
      paid: {
        backgroundColor: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0'
      },
      pending: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        border: '1px solid #fde68a'
      }
    }

    return (
      <span style={{
        ...styles[status],
        padding: '0.25rem 0.5rem',
        borderRadius: '0',
        fontSize: '0.75rem',
        fontWeight: '500'
      }}>
        {status === 'paid' ? 'Pago' : 'Pendente'}
      </span>
    )
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <LoadingSpinner message="Carregando transações..." />
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="card" style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'var(--gray-500)'
      }}>
        <p style={{ margin: 0, fontSize: '1rem' }}>
          Nenhuma transação encontrada
        </p>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{
              backgroundColor: 'var(--gray-50)',
              borderBottom: '1px solid var(--gray-200)'
            }}>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '500',
                color: 'var(--gray-700)',
                borderRight: '1px solid var(--gray-200)'
              }}>
                Transação
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '500',
                color: 'var(--gray-700)',
                borderRight: '1px solid var(--gray-200)'
              }}>
                Categoria
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '500',
                color: 'var(--gray-700)',
                borderRight: '1px solid var(--gray-200)'
              }}>
                Conta/Cartão
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '500',
                color: 'var(--gray-700)',
                borderRight: '1px solid var(--gray-200)'
              }}>
                Data
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'left',
                fontWeight: '500',
                color: 'var(--gray-700)',
                borderRight: '1px solid var(--gray-200)'
              }}>
                Status
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'right',
                fontWeight: '500',
                color: 'var(--gray-700)',
                borderRight: '1px solid var(--gray-200)'
              }}>
                Valor
              </th>
              <th style={{
                padding: '1rem',
                textAlign: 'center',
                fontWeight: '500',
                color: 'var(--gray-700)'
              }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction, index) => (
              <tr
                key={transaction._id}
                style={{
                  borderBottom: index < transactions.length - 1 ? '1px solid var(--gray-200)' : 'none',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--gray-50)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <td style={{
                  padding: '1rem',
                  borderRight: '1px solid var(--gray-200)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p style={{
                        margin: '0 0 0.25rem 0',
                        fontWeight: '500',
                        color: 'var(--gray-900)'
                      }}>
                        {transaction.description}
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--gray-500)',
                        textTransform: 'capitalize'
                      }}>
                        {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                      </p>
                    </div>
                  </div>
                </td>
                
                <td style={{
                  padding: '1rem',
                  borderRight: '1px solid var(--gray-200)'
                }}>
                  <span style={{
                    backgroundColor: 'var(--gray-100)',
                    color: 'var(--gray-700)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {transaction.category}
                  </span>
                </td>
                
                <td style={{
                  padding: '1rem',
                  borderRight: '1px solid var(--gray-200)'
                }}>
                  {transaction.accountId && (
                    <span style={{
                      color: 'var(--gray-600)',
                      fontSize: '0.875rem'
                    }}>
                      {transaction.accountId.name}
                    </span>
                  )}
                  {transaction.creditCardId && (
                    <span style={{
                      color: 'var(--gray-600)',
                      fontSize: '0.875rem'
                    }}>
                      {transaction.creditCardId.name}
                    </span>
                  )}
                  {!transaction.accountId && !transaction.creditCardId && (
                    <span style={{
                      color: 'var(--gray-400)',
                      fontSize: '0.875rem'
                    }}>
                      -
                    </span>
                  )}
                </td>
                
                <td style={{
                  padding: '1rem',
                  borderRight: '1px solid var(--gray-200)',
                  color: 'var(--gray-600)'
                }}>
                  {formatDate(transaction.date)}
                </td>
                
                <td style={{
                  padding: '1rem',
                  borderRight: '1px solid var(--gray-200)'
                }}>
                  {getStatusBadge(transaction.status)}
                </td>
                
                <td style={{
                  padding: '1rem',
                  borderRight: '1px solid var(--gray-200)',
                  textAlign: 'right',
                  fontWeight: '600',
                  color: getTransactionColor(transaction.type)
                }}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </td>
                
                <td style={{
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => onEdit(transaction)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--gray-500)',
                        padding: '0.25rem'
                      }}
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction)}
                      disabled={deletingId === transaction._id}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: deletingId === transaction._id ? 'not-allowed' : 'pointer',
                        color: deletingId === transaction._id ? 'var(--gray-300)' : 'var(--error)',
                        padding: '0.25rem'
                      }}
                      title="Excluir"
                    >
                      {deletingId === transaction._id ? (
                        <div className="loading" style={{ width: '16px', height: '16px' }}></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pagination.pages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderTop: '1px solid var(--gray-200)',
          backgroundColor: 'var(--gray-50)'
        }}>
          <span style={{
            color: 'var(--gray-600)',
            fontSize: '0.875rem'
          }}>
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} transações
          </span>
          
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem'
              }}
            >
              Anterior
            </button>
            
            <span style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--white)',
              border: '1px solid var(--gray-300)',
              color: 'var(--gray-700)',
              fontSize: '0.875rem'
            }}>
              {pagination.page} de {pagination.pages}
            </span>
            
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="btn btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem'
              }}
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
