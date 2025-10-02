import { useState, useEffect } from 'react'
import { CreditCard } from '../../types'

interface CreditCardFormProps {
  creditCard?: CreditCard | null
  onSuccess: (creditCard: CreditCard) => void
  onClose: () => void
}

export default function CreditCardForm({ creditCard, onSuccess, onClose }: CreditCardFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    bank: '',
    limit: '',
    currentBalance: '0',
    closingDay: '5',
    dueDay: '10'
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (creditCard) {
      setFormData({
        name: creditCard.name,
        bank: creditCard.bank,
        limit: creditCard.limit.toString(),
        currentBalance: creditCard.currentBalance.toString(),
        closingDay: creditCard.closingDay.toString(),
        dueDay: creditCard.dueDay.toString()
      })
    }
  }, [creditCard])

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
        limit: parseFloat(formData.limit),
        currentBalance: parseFloat(formData.currentBalance),
        closingDay: parseInt(formData.closingDay),
        dueDay: parseInt(formData.dueDay)
      }

      let response
      if (creditCard) {
        response = await fetch(`/api/credit-cards/${creditCard._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(data)
        })
      } else {
        response = await fetch('/api/credit-cards', {
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
        throw new Error(errorData.error || 'Erro ao salvar cartão')
      }

      const result = await response.json()
      onSuccess(result.creditCard)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const generateDayOptions = () => {
    return Array.from({ length: 31 }, (_, i) => i + 1)
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
            {creditCard ? 'Editar Cartão' : 'Novo Cartão'}
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
            <label className="form-label">Nome do cartão</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Ex: Cartão Principal"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Banco</label>
            <input
              type="text"
              name="bank"
              className="form-input"
              value={formData.bank}
              onChange={handleInputChange}
              required
              placeholder="Ex: Banco do Brasil"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Limite</label>
            <input
              type="number"
              name="limit"
              className="form-input"
              value={formData.limit}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              placeholder="0,00"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Saldo atual</label>
            <input
              type="number"
              name="currentBalance"
              className="form-input"
              value={formData.currentBalance}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="0,00"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Dia de fechamento</label>
              <select
                name="closingDay"
                className="form-select"
                value={formData.closingDay}
                onChange={handleInputChange}
                required
              >
                {generateDayOptions().map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Dia de vencimento</label>
              <select
                name="dueDay"
                className="form-select"
                value={formData.dueDay}
                onChange={handleInputChange}
                required
              >
                {generateDayOptions().map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
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
                creditCard ? 'Atualizar' : 'Criar'
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
