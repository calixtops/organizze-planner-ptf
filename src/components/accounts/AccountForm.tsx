import { useState, useEffect } from 'react'
import { Account } from '../../types'

interface AccountFormProps {
  account?: Account | null
  onSuccess: (account: Account) => void
  onClose: () => void
}

export default function AccountForm({ account, onSuccess, onClose }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as 'checking' | 'savings' | 'investment' | 'credit',
    balance: '',
    bank: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.balance.toString(),
        bank: account.bank || ''
      })
    }
  }, [account])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = {
        ...formData,
        balance: parseFloat(formData.balance) || 0
      }

      let response
      if (account) {
        response = await fetch(`/api/accounts/${account._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        })
      } else {
        response = await fetch('/api/accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar conta')
      }

      const result = await response.json()
      onSuccess(result.account)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--white)',
        borderRadius: '0',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            color: 'var(--primary-dark)',
            fontSize: '1.5rem',
            fontWeight: '600',
            margin: 0
          }}>
            {account ? 'Editar Conta' : 'Nova Conta'}
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'var(--gray-500)'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '0',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome da conta</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Ex: Conta Corrente Principal"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de conta</label>
            <select
              name="type"
              className="form-select"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="checking">Conta Corrente</option>
              <option value="savings">Poupança</option>
              <option value="investment">Investimento</option>
              <option value="credit">Crédito</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Saldo inicial</label>
            <input
              type="number"
              name="balance"
              className="form-input"
              value={formData.balance}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="0,00"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Banco (opcional)</label>
            <input
              type="text"
              name="bank"
              className="form-input"
              value={formData.bank}
              onChange={handleInputChange}
              placeholder="Ex: Banco do Brasil"
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? (
                <>
                  <div className="loading"></div>
                  Salvando...
                </>
              ) : (
                account ? 'Atualizar' : 'Criar'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
