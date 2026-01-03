import { useEffect, useState } from 'react'
import { Plus, X, Home, ShoppingBag, CreditCard, Users } from 'lucide-react'
import api, { familyMembersService, installmentsService } from '../../services/api'

interface QuickExpenseModalProps {
  onExpenseAdded?: () => void
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

type ExpenseType = 'fixed' | 'variable' | 'installment'

export default function QuickExpenseModal({ onExpenseAdded }: QuickExpenseModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expenseType, setExpenseType] = useState<ExpenseType>('variable')
  const [members, setMembers] = useState<Array<{ _id: string, name: string, color: string }>>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Form comum (fixo e variável)
  const [commonFormData, setCommonFormData] = useState({
    description: '',
    amount: '',
    category: 'Outros',
    date: new Date().toISOString().split('T')[0],
    isFamily: false,
    paidBy: ''
  })

  // Form de parcelamento
  const [installmentFormData, setInstallmentFormData] = useState({
    description: '',
    totalAmount: '',
    installments: '',
    category: 'Compras',
    startDate: new Date().toISOString().split('T')[0],
    paymentDay: '10',
    isFamily: false,
    paidBy: '',
    initialPaid: '',
    autoMarkPaid: true
  })

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await familyMembersService.getAll()
        setMembers(Array.isArray(response.data) ? response.data : [])
      } catch (error) {
        console.error('Erro ao carregar membros:', error)
        setMembers([])
      }
    }
    if (isOpen) {
      loadMembers()
    }
  }, [isOpen])

  const resetForms = () => {
    setCommonFormData({
      description: '',
      amount: '',
      category: 'Outros',
      date: new Date().toISOString().split('T')[0],
      isFamily: false,
      paidBy: ''
    })
    setInstallmentFormData({
      description: '',
      totalAmount: '',
      installments: '',
      category: 'Compras',
      startDate: new Date().toISOString().split('T')[0],
      paymentDay: '10',
      isFamily: false,
      paidBy: '',
      initialPaid: '',
      autoMarkPaid: true
    })
    setErrors({})
  }

  const handleClose = () => {
    setIsOpen(false)
    resetForms()
    setExpenseType('variable')
  }

  const handleCommonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!commonFormData.description || !commonFormData.amount || !commonFormData.category) {
      setErrors({ submit: 'Preencha todos os campos obrigatórios' })
      return
    }

    const amount = parseFloat(commonFormData.amount)
    if (isNaN(amount) || amount <= 0) {
      setErrors({ submit: 'Valor deve ser maior que zero' })
      return
    }

    setLoading(true)
    try {
      await api.post('/transactions', {
        description: commonFormData.description,
        amount: amount,
        type: 'expense',
        nature: expenseType,
        category: commonFormData.category,
        date: new Date(commonFormData.date).toISOString(),
        isFamily: commonFormData.isFamily,
        paidBy: commonFormData.isFamily && commonFormData.paidBy ? commonFormData.paidBy : undefined
      })

      handleClose()
      onExpenseAdded?.()
    } catch (error: any) {
      console.error('Erro ao adicionar gasto:', error)
      setErrors({ submit: error.response?.data?.error || 'Erro ao adicionar gasto. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const handleInstallmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!installmentFormData.description || !installmentFormData.totalAmount || 
        !installmentFormData.installments || !installmentFormData.category) {
      setErrors({ submit: 'Preencha todos os campos obrigatórios' })
      return
    }

    const totalAmount = parseFloat(installmentFormData.totalAmount)
    const installments = parseInt(installmentFormData.installments)
    
    if (isNaN(totalAmount) || totalAmount <= 0) {
      setErrors({ submit: 'Valor total deve ser maior que zero' })
      return
    }

    if (isNaN(installments) || installments < 2) {
      setErrors({ submit: 'Número de parcelas deve ser no mínimo 2' })
      return
    }

    setLoading(true)
    try {
      await installmentsService.create({
        description: installmentFormData.description,
        totalAmount: totalAmount,
        installments: installments,
        category: installmentFormData.category,
        startDate: installmentFormData.startDate,
        paymentDay: parseInt(installmentFormData.paymentDay),
        isFamily: installmentFormData.isFamily,
        paidBy: installmentFormData.isFamily && installmentFormData.paidBy ? installmentFormData.paidBy : undefined,
        initialPaid: installmentFormData.initialPaid ? parseInt(installmentFormData.initialPaid) : 0,
        autoMarkPaid: installmentFormData.autoMarkPaid
      })

      handleClose()
      onExpenseAdded?.()
    } catch (error: any) {
      console.error('Erro ao criar parcelamento:', error)
      setErrors({ submit: error.response?.data?.error || 'Erro ao criar parcelamento. Tente novamente.' })
    } finally {
      setLoading(false)
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
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '0',
            width: '100%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '2px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
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
              <Plus size={24} />
              Adicionar Gasto
            </h2>
            <button
              onClick={handleClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                color: '#666',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0'
                e.currentTarget.style.color = '#333'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = '#666'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #f0f0f0',
            backgroundColor: '#f8f9fa'
          }}>
            <button
              onClick={() => setExpenseType('fixed')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                backgroundColor: expenseType === 'fixed' ? 'white' : 'transparent',
                color: expenseType === 'fixed' ? '#e67e22' : '#666',
                fontWeight: expenseType === 'fixed' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderBottom: expenseType === 'fixed' ? '3px solid #e67e22' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <Home size={18} />
              Fixo
            </button>
            <button
              onClick={() => setExpenseType('variable')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                backgroundColor: expenseType === 'variable' ? 'white' : 'transparent',
                color: expenseType === 'variable' ? '#3498db' : '#666',
                fontWeight: expenseType === 'variable' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderBottom: expenseType === 'variable' ? '3px solid #3498db' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <ShoppingBag size={18} />
              Corrente
            </button>
            <button
              onClick={() => setExpenseType('installment')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                backgroundColor: expenseType === 'installment' ? 'white' : 'transparent',
                color: expenseType === 'installment' ? '#9b59b6' : '#666',
                fontWeight: expenseType === 'installment' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderBottom: expenseType === 'installment' ? '3px solid #9b59b6' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <CreditCard size={18} />
              Parcelamento
            </button>
          </div>

          {/* Content */}
          <div style={{
            padding: '2rem',
            overflowY: 'auto',
            flex: 1
          }}>
            {expenseType !== 'installment' ? (
              <form onSubmit={handleCommonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Description */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={commonFormData.description}
                    onChange={(e) => setCommonFormData({ ...commonFormData, description: e.target.value })}
                    placeholder="Ex: Internet, Supermercado..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#e67e22'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Valor *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666',
                      fontWeight: '600'
                    }}>
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={commonFormData.amount}
                      onChange={(e) => setCommonFormData({ ...commonFormData, amount: e.target.value })}
                      placeholder="0,00"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#e67e22'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Categoria *
                  </label>
                  <select
                    value={commonFormData.category}
                    onChange={(e) => setCommonFormData({ ...commonFormData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#e67e22'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Data *
                  </label>
                  <input
                    type="date"
                    value={commonFormData.date}
                    onChange={(e) => setCommonFormData({ ...commonFormData, date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#e67e22'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  />
                </div>

                {/* Is Family */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!commonFormData.isFamily) {
                      e.currentTarget.style.borderColor = '#e67e22'
                      e.currentTarget.style.backgroundColor = '#fff5f0'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!commonFormData.isFamily) {
                      e.currentTarget.style.borderColor = '#e0e0e0'
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                  >
                    <input
                      type="checkbox"
                      checked={commonFormData.isFamily}
                      onChange={(e) => {
                        setCommonFormData({
                          ...commonFormData,
                          isFamily: e.target.checked,
                          paidBy: e.target.checked ? commonFormData.paidBy : ''
                        })
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} color={commonFormData.isFamily ? '#3498db' : '#999'} />
                      <span style={{ color: '#333', fontWeight: '500' }}>
                        Gasto Familiar
                      </span>
                    </div>
                  </label>
                </div>

                {/* Paid By */}
                {commonFormData.isFamily && (
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#333',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      Quem Pagou *
                    </label>
                    <select
                      value={commonFormData.paidBy}
                      onChange={(e) => setCommonFormData({ ...commonFormData, paidBy: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: 'white',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#e67e22'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    >
                      <option value="">Selecione...</option>
                      {members.map(member => (
                        <option key={member._id} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Error */}
                {errors.submit && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    color: '#c33',
                    fontSize: '0.875rem',
                    textAlign: 'center'
                  }}>
                    {errors.submit}
                  </div>
                )}

                {/* Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#666',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#999'
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#ddd'
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
                      backgroundColor: expenseType === 'fixed' ? '#e67e22' : '#3498db',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {loading ? 'Salvando...' : (
                      <>
                        <Plus size={16} />
                        Adicionar
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleInstallmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Description */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={installmentFormData.description}
                    onChange={(e) => setInstallmentFormData({ ...installmentFormData, description: e.target.value })}
                    placeholder="Ex: Notebook, Sofá..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  />
                </div>

                {/* Total Amount */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Valor Total *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666',
                      fontWeight: '600'
                    }}>
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={installmentFormData.totalAmount}
                      onChange={(e) => setInstallmentFormData({ ...installmentFormData, totalAmount: e.target.value })}
                      placeholder="0,00"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    />
                  </div>
                </div>

                {/* Installments */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#333',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      Número de Parcelas *
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={installmentFormData.installments}
                      onChange={(e) => setInstallmentFormData({ ...installmentFormData, installments: e.target.value })}
                      placeholder="Ex: 12"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#333',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      Dia do Vencimento *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={installmentFormData.paymentDay}
                      onChange={(e) => setInstallmentFormData({ ...installmentFormData, paymentDay: e.target.value })}
                      placeholder="Ex: 10"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Categoria *
                  </label>
                  <select
                    value={installmentFormData.category}
                    onChange={(e) => setInstallmentFormData({ ...installmentFormData, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'white',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#333',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    value={installmentFormData.startDate}
                    onChange={(e) => setInstallmentFormData({ ...installmentFormData, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    required
                  />
                </div>

                {/* Is Family */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!installmentFormData.isFamily) {
                      e.currentTarget.style.borderColor = '#9b59b6'
                      e.currentTarget.style.backgroundColor = '#f8f5ff'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!installmentFormData.isFamily) {
                      e.currentTarget.style.borderColor = '#e0e0e0'
                      e.currentTarget.style.backgroundColor = 'white'
                    }
                  }}
                  >
                    <input
                      type="checkbox"
                      checked={installmentFormData.isFamily}
                      onChange={(e) => {
                        setInstallmentFormData({
                          ...installmentFormData,
                          isFamily: e.target.checked,
                          paidBy: e.target.checked ? installmentFormData.paidBy : ''
                        })
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={16} color={installmentFormData.isFamily ? '#3498db' : '#999'} />
                      <span style={{ color: '#333', fontWeight: '500' }}>
                        Parcelamento Familiar
                      </span>
                    </div>
                  </label>
                </div>

                {/* Paid By */}
                {installmentFormData.isFamily && (
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#333',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      Quem Pagou *
                    </label>
                    <select
                      value={installmentFormData.paidBy}
                      onChange={(e) => setInstallmentFormData({ ...installmentFormData, paidBy: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: 'white',
                        outline: 'none',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                      required
                    >
                      <option value="">Selecione...</option>
                      {members.map(member => (
                        <option key={member._id} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Auto Mark Paid */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: installmentFormData.autoMarkPaid ? '#f0f9ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#9b59b6'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0'
                  }}
                  >
                    <input
                      type="checkbox"
                      checked={installmentFormData.autoMarkPaid}
                      onChange={(e) => setInstallmentFormData({ ...installmentFormData, autoMarkPaid: e.target.checked })}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ color: '#333', fontWeight: '500', flex: 1 }}>
                      Marcar parcelas passadas como pagas automaticamente
                    </span>
                  </label>
                </div>

                {/* Initial Paid (se não for automático) */}
                {!installmentFormData.autoMarkPaid && (
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#333',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      Parcelas Já Pagas
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={installmentFormData.initialPaid}
                      onChange={(e) => setInstallmentFormData({ ...installmentFormData, initialPaid: e.target.value })}
                      placeholder="0"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#9b59b6'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                )}

                {/* Error */}
                {errors.submit && (
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    color: '#c33',
                    fontSize: '0.875rem',
                    textAlign: 'center'
                  }}>
                    {errors.submit}
                  </div>
                )}

                {/* Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#666',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#999'
                      e.currentTarget.style.backgroundColor = '#f5f5f5'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#ddd'
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
                      backgroundColor: '#9b59b6',
                      color: 'white',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {loading ? 'Salvando...' : (
                      <>
                        <Plus size={16} />
                        Criar Parcelamento
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

