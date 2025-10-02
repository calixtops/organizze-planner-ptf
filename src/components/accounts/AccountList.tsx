import { Account } from '../../types'
import { formatCurrency } from '../../utils/format'
import { Edit, Trash2, Wallet } from 'lucide-react'

interface AccountListProps {
  accounts: Account[]
  onEdit: (account: Account) => void
  onDelete: (accountId: string) => void
}

export default function AccountList({ accounts, onEdit, onDelete }: AccountListProps) {
  const handleDelete = async (account: Account) => {
    if (!confirm(`Tem certeza que deseja excluir a conta "${account.name}"?`)) {
      return
    }

    try {
      await fetch(`/api/accounts/${account._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      onDelete(account._id)
    } catch (error) {
      console.error('Erro ao deletar conta:', error)
      alert('Erro ao deletar conta')
    }
  }

  const getAccountTypeLabel = (type: string) => {
    const types = {
      checking: 'Conta Corrente',
      savings: 'Poupança',
      investment: 'Investimento',
      credit: 'Crédito'
    }
    return types[type as keyof typeof types] || type
  }


  if (accounts.length === 0) {
    return (
      <div className="card" style={{
        textAlign: 'center',
        padding: '3rem',
        color: 'var(--gray-500)'
      }}>
        <Wallet size={48} style={{ margin: '0 auto 1rem', color: 'var(--gray-400)' }} />
        <h3 style={{
          color: 'var(--gray-600)',
          fontSize: '1.125rem',
          fontWeight: '500',
          marginBottom: '0.5rem',
          margin: 0
        }}>
          Nenhuma conta cadastrada
        </h3>
        <p style={{
          margin: 0,
          fontSize: '0.875rem'
        }}>
          Adicione sua primeira conta bancária para começar
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
      {accounts.map((account) => (
        <div key={account._id} className="card">
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
                {account.name}
              </h3>
              <p style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.875rem',
                color: 'var(--gray-600)'
              }}>
                {getAccountTypeLabel(account.type)}
              </p>
              {account.bank && (
                <p style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  color: 'var(--gray-500)'
                }}>
                  {account.bank}
                </p>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={() => onEdit(account)}
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
                onClick={() => handleDelete(account)}
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
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
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
              fontSize: '1.25rem',
              fontWeight: '700',
              color: account.balance >= 0 ? 'var(--success)' : 'var(--error)'
            }}>
              {formatCurrency(account.balance)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
