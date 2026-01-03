import { useEffect, useState } from 'react'
import { Plus, X, DollarSign, Tag, Calendar, Sparkles } from 'lucide-react'
import api, { groupsService } from '../../services/api'
import { validationRules, validate } from '../../utils/validation'
import { geminiService } from '../../services/gemini'

interface QuickExpenseFormProps {
  onTransactionAdded?: () => void
}

const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Compras',
  'Serviços',
  'Assinaturas',
  'Outros'
]

export default function QuickExpenseForm({ onTransactionAdded }: QuickExpenseFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [groups, setGroups] = useState<Array<{ _id: string, name: string }>>([])
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    accountId: '',
    nature: 'variable',
    groupId: ''
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar dados
    const validationErrors = validate(formData, {
      description: validationRules.transaction.description,
      amount: { ...validationRules.transaction.amount, custom: (value: string) => {
        const numValue = parseFloat(value)
        if (isNaN(numValue) || !isFinite(numValue)) {
          return 'Valor deve ser um número válido'
        }
        if (numValue <= 0) {
          return 'Valor deve ser maior que zero'
        }
        return null
      }},
      category: validationRules.transaction.category
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors({})
    
    try {
      await api.post('/transactions', {
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: 'expense',
        nature: formData.nature,
        groupId: formData.groupId || undefined,
        category: formData.category,
        accountId: formData.accountId || undefined,
        date: new Date().toISOString()
      })

      // Reset form
      setFormData({
        description: '',
        amount: '',
        category: '',
        accountId: '',
        nature: 'variable',
        groupId: ''
      })
      setErrors({})
      setIsOpen(false)
      onTransactionAdded?.()
    } catch (error: any) {
      console.error('Erro ao adicionar transação:', error)
      setErrors({ submit: 'Erro ao adicionar transação. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const handleAICategorization = async () => {
    if (!formData.description || !formData.amount) {
      setErrors({ ai: 'Preencha descrição e valor antes de usar a IA' })
      return
    }

    setAiSuggesting(true)
    setErrors({})

    try {
      const suggestion = await geminiService.categorizeTransaction(
        formData.description,
        parseFloat(formData.amount)
      )

      setFormData(prev => ({
        ...prev,
        category: suggestion.category
      }))

      // Mostrar sugestão da IA
      setErrors({ 
        ai: `✨ IA sugeriu: ${suggestion.category} (${(suggestion.confidence * 100).toFixed(0)}% confiança)` 
      })

    } catch (error) {
      console.error('Erro na categorização IA:', error)
      setErrors({ ai: 'Erro ao usar IA. Selecione manualmente.' })
    } finally {
      setAiSuggesting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--accent-orange)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(242, 89, 36, 0.3)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 12px 20px rgba(242, 89, 36, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(242, 89, 36, 0.3)'
        }}
      >
        <Plus size={28} />
      </button>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={() => setIsOpen(false)}
      >
        {/* Modal */}
        <div
          className="modal-mobile"
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              margin: 0,
              color: 'var(--primary-dark)',
              fontSize: '1.5rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <DollarSign size={24} />
              Adicionar Gasto
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                color: 'var(--gray-500)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--gray-100)'
                e.currentTarget.style.color = 'var(--gray-700)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--gray-500)'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Description */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--gray-700)',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                Descrição
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Supermercado, Gasolina, Cinema..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                required
              />
              {errors.description && (
                <p style={{
                  color: 'var(--error)',
                  fontSize: '0.75rem',
                  margin: '0.25rem 0 0 0'
                }}>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'var(--gray-700)',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                Valor
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--gray-500)',
                  fontWeight: '600'
                }}>
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0,00"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '2px solid var(--gray-200)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    transition: 'border-color 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                  required
                />
              </div>
              {errors.amount && (
                <p style={{
                  color: 'var(--error)',
                  fontSize: '0.75rem',
                  margin: '0.25rem 0 0 0'
                }}>
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label style={{
                marginBottom: '0.5rem',
                color: 'var(--gray-700)',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Tag size={16} />
                  Categoria
                </div>
                <button
                  type="button"
                  onClick={handleAICategorization}
                  disabled={aiSuggesting || !formData.description || !formData.amount}
                  style={{
                    backgroundColor: 'var(--accent-orange)',
                    color: 'white',
                    border: 'none',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: aiSuggesting || !formData.description || !formData.amount ? 'not-allowed' : 'pointer',
                    opacity: aiSuggesting || !formData.description || !formData.amount ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!aiSuggesting && formData.description && formData.amount) {
                      e.currentTarget.style.backgroundColor = '#e04a1f'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!aiSuggesting && formData.description && formData.amount) {
                      e.currentTarget.style.backgroundColor = 'var(--accent-orange)'
                    }
                  }}
                >
                  {aiSuggesting ? (
                    <>
                      <div style={{ width: '12px', height: '12px', border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      IA...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      IA
                    </>
                  )}
                </button>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
                required
              >
                <option value="">Selecione uma categoria</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p style={{
                  color: 'var(--error)',
                  fontSize: '0.75rem',
                  margin: '0.25rem 0 0 0'
                }}>
                  {errors.category}
                </p>
              )}
              {errors.ai && (
                <p style={{
                  color: errors.ai.includes('✨') ? 'var(--success)' : 'var(--error)',
                  fontSize: '0.75rem',
                  margin: '0.25rem 0 0 0',
                  backgroundColor: errors.ai.includes('✨') ? '#f0fdf4' : '#fef2f2',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: `1px solid ${errors.ai.includes('✨') ? '#bbf7d0' : '#fecaca'}`
                }}>
                  {errors.ai}
                </p>
              )}
            </div>

            {/* Natureza (Fixo/Variável) */}
            <div>
              <label style={{
                marginBottom: '0.5rem',
                color: 'var(--gray-700)',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                Tipo de gasto
              </label>
              <select
                value={formData.nature}
                onChange={(e) => setFormData({ ...formData, nature: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              >
                <option value="variable">Variável (gasto do mês)</option>
                <option value="fixed">Fixo</option>
              </select>
            </div>

            {/* Grupo */}
            <div>
              <label style={{
                marginBottom: '0.5rem',
                color: 'var(--gray-700)',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                Grupo (opcional)
              </label>
              <select
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: 'white',
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              >
                <option value="">Pessoal</option>
                {groups.map(group => (
                  <option key={group._id} value={group._id}>{group.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label style={{
                marginBottom: '0.5rem',
                color: 'var(--gray-700)',
                fontWeight: '600',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={16} />
                Data
              </label>
              <input
                type="date"
                value={new Date().toISOString().split('T')[0]}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--gray-200)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-200)'}
              />
            </div>

            {/* Error de submit */}
            {errors.submit && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: 'var(--error)',
                fontSize: '0.875rem',
                textAlign: 'center'
              }}>
                {errors.submit}
              </div>
            )}

            {/* Buttons */}
            <div className="btn-group" style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid var(--gray-300)',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  color: 'var(--gray-700)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-400)'
                  e.currentTarget.style.backgroundColor = 'var(--gray-50)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--gray-300)'
                  e.currentTarget.style.backgroundColor = 'white'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: 'var(--accent-orange)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#e04a1f'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'var(--accent-orange)'
                  }
                }}
              >
                {loading ? (
                  <>
                    <div className="loading" style={{ width: '16px', height: '16px' }}></div>
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Adicionar Gasto
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

