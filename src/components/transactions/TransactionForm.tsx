import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Transaction, Account, CreditCard, AISuggestion, Group } from '../../types'

interface PopulatedTransaction extends Omit<Transaction, 'accountId' | 'creditCardId'> {
  accountId?: Account
  creditCardId?: CreditCard
}
import { formatCurrency } from '../../utils/format'
import { Loader2, Sparkles } from 'lucide-react'

interface TransactionFormProps {
  transaction?: PopulatedTransaction | null
  accounts: Account[]
  creditCards: CreditCard[]
  groups?: Group[]
  onSuccess: (transaction: PopulatedTransaction) => void
  onClose: () => void
}

export default function TransactionForm({ 
  transaction, 
  accounts, 
  creditCards, 
  groups = [],
  onSuccess, 
  onClose 
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    nature: 'variable' as 'fixed' | 'variable',
    category: '',
    status: 'paid' as 'paid' | 'pending',
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    creditCardId: '',
    groupId: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (transaction) {
      setFormData({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        nature: transaction.nature || 'variable',
        category: transaction.category,
        status: transaction.status,
        date: new Date(transaction.date).toISOString().split('T')[0],
        accountId: typeof transaction.accountId === 'string' ? transaction.accountId : transaction.accountId?._id || '',
        creditCardId: typeof transaction.creditCardId === 'string' ? transaction.creditCardId : transaction.creditCardId?._id || '',
        groupId: transaction.groupId || ''
      })
    }
  }, [transaction])

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
        amount: parseFloat(formData.amount),
        accountId: formData.accountId || undefined,
        creditCardId: formData.creditCardId || undefined,
        groupId: formData.groupId || undefined
      }

      let response
      if (transaction) {
        response = await api.put(`/transactions/${transaction._id}`, data)
      } else {
        response = await api.post('/transactions', data)
      }

      onSuccess(response.data.transaction)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao salvar transação')
    } finally {
      setLoading(false)
    }
  }

  const handleAISuggestion = async () => {
    if (!formData.description || !formData.amount) {
      setError('Descrição e valor são obrigatórios para sugestão de IA')
      return
    }

    setAiLoading(true)
    setError('')

    try {
      const response = await api.post('/ai/suggest-category', {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type
      })

      setAiSuggestion(response.data.suggestion)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao obter sugestão de IA')
    } finally {
      setAiLoading(false)
    }
  }

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setFormData(prev => ({ ...prev, category: aiSuggestion.category }))
      setAiSuggestion(null)
    }
  }

  const categories = {
    income: ['Salário', 'Freelance', 'Investimentos', 'Vendas', 'Bônus', 'Outros'],
    expense: ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Compras', 'Serviços', 'Assinaturas', 'Outros']
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
        maxWidth: '500px',
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
            {transaction ? 'Editar Transação' : 'Nova Transação'}
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
            <label className="form-label">Descrição</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                name="description"
                className="form-input"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Ex: Compra no supermercado"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleAISuggestion}
                disabled={aiLoading || !formData.description || !formData.amount}
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem',
                  minWidth: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                title="Sugestão de categoria por IA"
              >
                {aiLoading ? (
                  <Loader2 size={16} className="loading" />
                ) : (
                  <Sparkles size={16} />
                )}
              </button>
            </div>
          </div>

          {aiSuggestion && (
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '0',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem'
              }}>
                <div>
                  <p style={{
                    margin: '0 0 0.5rem 0',
                    fontWeight: '500',
                    color: 'var(--primary-dark)'
                  }}>
                    Sugestão da IA: {aiSuggestion.category}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: 'var(--gray-600)'
                  }}>
                    {aiSuggestion.explanation}
                  </p>
                  <p style={{
                    margin: '0.5rem 0 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--gray-500)'
                  }}>
                    Confiança: {Math.round(aiSuggestion.confidence * 100)}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyAISuggestion}
                  className="btn btn-primary"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Valor</label>
              <input
                type="number"
                name="amount"
                className="form-input"
                value={formData.amount}
                onChange={handleInputChange}
                required
                min="0.01"
                step="0.01"
                placeholder="0,00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select
                name="type"
                className="form-select"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Selecione...</option>
                {categories[formData.type].map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Natureza</label>
              <select
                name="nature"
                className="form-select"
                value={formData.nature}
                onChange={handleInputChange}
              >
                <option value="variable">Variável</option>
                <option value="fixed">Fixo</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Data</label>
            <input
              type="date"
              name="date"
              className="form-input"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Grupo (opcional)</label>
            <select
              name="groupId"
              className="form-select"
              value={formData.groupId}
              onChange={handleInputChange}
            >
              <option value="">Pessoal</option>
              {groups?.map((group: Group) => (
                <option key={group._id} value={group._id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Conta</label>
              <select
                name="accountId"
                className="form-select"
                value={formData.accountId}
                onChange={handleInputChange}
              >
                <option value="">Selecione uma conta...</option>
                {accounts.map(account => (
                  <option key={account._id} value={account._id}>
                    {account.name} - {formatCurrency(account.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cartão de Crédito</label>
              <select
                name="creditCardId"
                className="form-select"
                value={formData.creditCardId}
                onChange={handleInputChange}
              >
                <option value="">Selecione um cartão...</option>
                {creditCards.map(card => (
                  <option key={card._id} value={card._id}>
                    {card.name} - {formatCurrency(card.limit - card.currentBalance)} disponível
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
                transaction ? 'Atualizar' : 'Criar'
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
