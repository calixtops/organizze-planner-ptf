import { CreditCard } from '../../types'
import { formatCurrency } from '../../utils/format'
import { Edit, Trash2, CreditCard as CreditCardIcon } from 'lucide-react'

interface CreditCardListProps {
  creditCards: CreditCard[]
  onEdit: (creditCard: CreditCard) => void
  onDelete: (creditCardId: string) => void
}

export default function CreditCardList({ creditCards, onEdit, onDelete }: CreditCardListProps) {
  const handleDelete = async (creditCard: CreditCard) => {
    if (!confirm(`Tem certeza que deseja excluir o cartão "${creditCard.name}"?`)) {
      return
    }

    try {
      await fetch(`/api/credit-cards/${creditCard._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      onDelete(creditCard._id)
    } catch (error) {
      console.error('Erro ao deletar cartão:', error)
      alert('Erro ao deletar cartão')
    }
  }

  const getAvailableLimit = (creditCard: CreditCard) => {
    return creditCard.limit - creditCard.currentBalance
  }

  const getUsagePercentage = (creditCard: CreditCard) => {
    return (creditCard.currentBalance / creditCard.limit) * 100
  }

  if (creditCards.length === 0) {
    return (
      <div className="card" style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'var(--gray-500)'
      }}>
        <CreditCardIcon size={48} style={{ margin: '0 auto 1rem', color: 'var(--gray-400)' }} />
        <h3 style={{
          color: 'var(--gray-600)',
          fontSize: '1.125rem',
          fontWeight: '500',
          marginBottom: '0.5rem',
          margin: 0
        }}>
          Nenhum cartão cadastrado
        </h3>
        <p style={{
          margin: 0,
          fontSize: '0.875rem'
        }}>
          Adicione seu primeiro cartão de crédito
        </p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem'
    }}>
      {creditCards.map((creditCard) => {
        const availableLimit = getAvailableLimit(creditCard)
        const usagePercentage = getUsagePercentage(creditCard)
        
        return (
          <div key={creditCard._id} className="card">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  color: 'var(--primary-dark)',
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  margin: 0
                }}>
                  {creditCard.name}
                </h3>
                <p style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)'
                }}>
                  {creditCard.bank}
                </p>
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: 'var(--gray-500)'
                }}>
                  Fechamento: dia {creditCard.closingDay} • Vencimento: dia {creditCard.dueDay}
                </p>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => onEdit(creditCard)}
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
                  onClick={() => handleDelete(creditCard)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--error)',
                    padding: '0.25rem'
                  }}
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: 'var(--gray-50)',
                border: '1px solid var(--gray-200)'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  fontWeight: '500'
                }}>
                  Limite total
                </span>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--primary-dark)'
                }}>
                  {formatCurrency(creditCard.limit)}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: 'var(--gray-50)',
                border: '1px solid var(--gray-200)'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  fontWeight: '500'
                }}>
                  Saldo atual
                </span>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--error)'
                }}>
                  {formatCurrency(creditCard.currentBalance)}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: usagePercentage > 80 ? '#fef2f2' : '#f0f9ff',
                border: `1px solid ${usagePercentage > 80 ? '#fecaca' : '#bae6fd'}`
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: usagePercentage > 80 ? '#dc2626' : 'var(--info)',
                  fontWeight: '500'
                }}>
                  Disponível
                </span>
                <span style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: usagePercentage > 80 ? '#dc2626' : 'var(--info)'
                }}>
                  {formatCurrency(availableLimit)}
                </span>
              </div>
              
              <div style={{
                marginTop: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--gray-600)'
                  }}>
                    Uso do limite
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--gray-600)',
                    fontWeight: '500'
                  }}>
                    {usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'var(--gray-200)',
                  borderRadius: '0'
                }}>
                  <div style={{
                    width: `${Math.min(usagePercentage, 100)}%`,
                    height: '100%',
                    backgroundColor: usagePercentage > 80 ? 'var(--error)' : usagePercentage > 60 ? 'var(--warning)' : 'var(--success)',
                    borderRadius: '0'
                  }} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
