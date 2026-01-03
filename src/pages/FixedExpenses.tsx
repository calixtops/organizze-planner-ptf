import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionsService, groupsService, familyMembersService, recurringExpensesService } from '../services/api'
import { Transaction, Group, FamilyMember, RecurringExpense } from '../types'
import { formatCurrency, formatDate } from '../utils/format'

export default function FixedExpenses() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null)
  const [activeTab, setActiveTab] = useState<'manual' | 'recurring'>('recurring')
  
  // Form simplificado
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Moradia',
    date: new Date().toISOString().slice(0, 10),
    isFamily: false,
    paidBy: ''
  })

  // Form de gasto recorrente
  const [recurringFormData, setRecurringFormData] = useState({
    description: '',
    amount: '',
    category: 'Moradia',
    dayOfMonth: new Date().getDate().toString(),
    isFamily: false,
    paidBy: '',
    isActive: true
  })

  useEffect(() => {
    loadGroups()
    loadMembers()
    loadRecurringExpenses()
    if (user) loadExpenses()
  }, [user, selectedGroup])

  const loadGroups = async () => {
    try {
      const response = await groupsService.getAll()
      setGroups(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
      setGroups([])
    }
  }

  const loadMembers = async () => {
    try {
      const response = await familyMembersService.getAll()
      setMembers(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar membros:', error)
      setMembers([])
    }
  }

  const loadRecurringExpenses = async () => {
    try {
      const response = await recurringExpensesService.getAll()
      setRecurringExpenses(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar gastos recorrentes:', error)
      setRecurringExpenses([])
    }
  }

  const loadExpenses = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const params: any = {
        type: 'expense',
        nature: 'fixed',
        limit: 100 // Buscar últimos 100 gastos fixos
      }
      if (selectedGroup) params.groupId = selectedGroup
      
      const response = await transactionsService.getAll(params)
      console.log('Resposta da API:', response.data)
      
      // A API pode retornar { transactions: [...] } ou diretamente [...]
      const data = response.data.transactions || response.data
      console.log('Gastos fixos carregados:', data)
      setExpenses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar gastos fixos:', error)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        type: 'expense' as const,
        nature: 'fixed' as const,
        status: 'paid' as const,
        isFamily: formData.isFamily
      }

      if (editingExpense) {
        await transactionsService.update(editingExpense._id, data)
      } else {
        await transactionsService.create(data)
      }

      setShowForm(false)
      resetForm()
      loadExpenses()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar gasto')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir?')) return
    try {
      await transactionsService.delete(id)
      loadExpenses()
    } catch (error) {
      alert('Erro ao excluir')
    }
  }

  const handleEdit = (expense: Transaction) => {
    setEditingExpense(expense)
    setFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: new Date(expense.date).toISOString().slice(0, 10),
      isFamily: expense.isFamily || false,
      paidBy: expense.paidBy || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'Moradia',
      date: new Date().toISOString().slice(0, 10),
      isFamily: false,
      paidBy: ''
    })
    setEditingExpense(null)
  }

  // Funções para gastos recorrentes
  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...recurringFormData,
        amount: parseFloat(recurringFormData.amount),
        dayOfMonth: parseInt(recurringFormData.dayOfMonth),
        isFamily: recurringFormData.isFamily,
        paidBy: recurringFormData.paidBy || undefined
      }

      if (editingRecurring) {
        await recurringExpensesService.update(editingRecurring._id, data)
      } else {
        await recurringExpensesService.create(data)
      }

      setShowRecurringForm(false)
      resetRecurringForm()
      loadRecurringExpenses()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar gasto recorrente')
    }
  }

  const handleDeleteRecurring = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este gasto recorrente?')) return
    try {
      await recurringExpensesService.delete(id)
      loadRecurringExpenses()
    } catch (error) {
      alert('Erro ao excluir')
    }
  }

  const handleEditRecurring = (expense: RecurringExpense) => {
    setEditingRecurring(expense)
    setRecurringFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      dayOfMonth: expense.dayOfMonth.toString(),
      isFamily: expense.isFamily || false,
      paidBy: expense.paidBy || '',
      isActive: expense.isActive
    })
    setShowRecurringForm(true)
  }

  const handleGenerateTransaction = async (id: string) => {
    try {
      const now = new Date()
      await recurringExpensesService.generate(id, now.getMonth() + 1, now.getFullYear())
      alert('Transação gerada com sucesso!')
      loadExpenses()
      loadRecurringExpenses()
    } catch (error: any) {
      if (error.response?.status === 400) {
        alert(error.response.data.error || 'Transação já foi gerada para este mês')
      } else {
        alert('Erro ao gerar transação')
      }
    }
  }

  const handleGenerateAll = async () => {
    if (!window.confirm('Gerar todas as transações pendentes para este mês?')) return
    try {
      const now = new Date()
      const response = await recurringExpensesService.generateAll(now.getMonth() + 1, now.getFullYear())
      alert(`Geradas ${response.data.generated.length} transações!`)
      loadExpenses()
      loadRecurringExpenses()
    } catch (error) {
      alert('Erro ao gerar transações')
    }
  }

  const resetRecurringForm = () => {
    setRecurringFormData({
      description: '',
      amount: '',
      category: 'Moradia',
      dayOfMonth: new Date().getDate().toString(),
      isFamily: false,
      paidBy: '',
      isActive: true
    })
    setEditingRecurring(null)
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px 0' }}>📌 Gastos Fixos</h2>

      {/* Tabs */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('recurring')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'recurring' ? '#2ecc71' : '#ecf0f1',
            color: activeTab === 'recurring' ? 'white' : '#7f8c8d',
            border: 'none',
            borderRadius: '6px 0 0 6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          🔄 Gastos Recorrentes
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'manual' ? '#2ecc71' : '#ecf0f1',
            color: activeTab === 'manual' ? 'white' : '#7f8c8d',
            border: 'none',
            borderRadius: '0 6px 6px 0',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          ✏️ Gastos Manuais
        </button>
      </div>

      {/* Conteúdo da aba Recorrentes */}
      {activeTab === 'recurring' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#666' }}>
              Configure gastos que se repetem automaticamente todo mês
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {recurringExpenses.filter(r => r.isActive).length > 0 && (
                <button
                  onClick={handleGenerateAll}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}
                >
                  ⚡ Gerar Todos Este Mês
                </button>
              )}
              <button
                onClick={() => { resetRecurringForm(); setShowRecurringForm(true) }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                + Novo Gasto Recorrente
              </button>
            </div>
          </div>

          {/* Lista de gastos recorrentes */}
          {recurringExpenses.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#999',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <p>Nenhum gasto recorrente cadastrado</p>
              <p style={{ fontSize: '13px', marginTop: '10px' }}>
                Crie um gasto recorrente para que ele seja gerado automaticamente todo mês
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {recurringExpenses.map(expense => (
                <div
                  key={expense._id}
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: expense.isActive ? 'white' : '#f8f9fa',
                    opacity: expense.isActive ? 1 : 0.7
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0 }}>{expense.description}</h4>
                      {!expense.isActive && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#95a5a6',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          Inativo
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#f0f0f0',
                        marginRight: '10px'
                      }}>
                        {expense.category}
                      </span>
                      <span>💵 {formatCurrency(expense.amount)}</span>
                      <span style={{ margin: '0 10px', color: '#ddd' }}>|</span>
                      <span>📅 Dia {expense.dayOfMonth} de cada mês</span>
                      {expense.paidBy && (
                        <>
                          <span style={{ margin: '0 10px', color: '#ddd' }}>|</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: members.find(m => m.name === expense.paidBy)?.color || '#95a5a6',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            Pago por: {expense.paidBy}
                          </span>
                        </>
                      )}
                      {expense.lastGenerated && (
                        <>
                          <span style={{ margin: '0 10px', color: '#ddd' }}>|</span>
                          <span>Última geração: {formatDate(expense.lastGenerated)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {expense.isActive && (
                      <button
                        onClick={() => handleGenerateTransaction(expense._id)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="Gerar transação para este mês"
                      >
                        ⚡ Gerar
                      </button>
                    )}
                    <button
                      onClick={() => handleEditRecurring(expense)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#f39c12',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteRecurring(expense._id)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da aba Manuais */}
      {activeTab === 'manual' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ margin: 0, color: '#666' }}>
              Gastos fixos cadastrados manualmente
            </p>
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              + Novo Gasto Fixo
            </button>
          </div>

      {/* Filtro */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Grupo</label>
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          style={{ width: '300px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        >
          <option value="">Pessoal</option>
          {groups.map(group => (
            <option key={group._id} value={group._id}>{group.name}</option>
          ))}
        </select>
      </div>

      {/* Resumo */}
      <div style={{
        backgroundColor: '#e67e22',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '18px' }}>Total Mensal Gastos Fixos:</span>
        <strong style={{ fontSize: '32px' }}>{formatCurrency(total)}</strong>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Carregando...</div>
      ) : expenses.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#999'
        }}>
          <p>Nenhum gasto fixo cadastrado</p>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {expenses.map(expense => (
            <div
              key={expense._id}
              style={{
                padding: '20px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0' }}>{expense.description}</h4>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#f0f0f0',
                    marginRight: '10px'
                  }}>
                    {expense.category}
                  </span>
                  {formatDate(expense.date)}
                  {expense.paidBy && (
                    <>
                      <span style={{ margin: '0 10px', color: '#ddd' }}>|</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: members.find(m => m.name === expense.paidBy)?.color || '#95a5a6',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        Pago por: {expense.paidBy}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                  {formatCurrency(expense.amount)}
                </span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => handleEdit(expense)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(expense._id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      )}

      {/* Modal Formulário Simplificado - Manual */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>
                {editingExpense ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo'}
              </h3>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Descrição *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ex: Aluguel"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Data *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Moradia">Moradia (Aluguel/Condomínio)</option>
                  <option value="Energia">Energia</option>
                  <option value="Água">Água</option>
                  <option value="Internet">Internet/TV</option>
                  <option value="Telefone">Telefone</option>
                  <option value="Seguro">Seguro</option>
                  <option value="Plano de Saúde">Plano de Saúde</option>
                  <option value="Academia">Academia</option>
                  <option value="Assinaturas">Assinaturas</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Tipo de Gasto
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  backgroundColor: '#f0f0f0',
                  padding: '4px',
                  borderRadius: '8px',
                  width: '100%'
                }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFamily: false, paidBy: '' })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      backgroundColor: !formData.isFamily ? '#2ecc71' : 'transparent',
                      color: !formData.isFamily ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    👤 Pessoal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFamily: true })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      backgroundColor: formData.isFamily ? '#3498db' : 'transparent',
                      color: formData.isFamily ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    👨‍👩‍👧‍👦 Familiar
                  </button>
                </div>
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  {formData.isFamily 
                    ? 'Gastos familiares aparecem nas KPIs por membro'
                    : 'Gastos pessoais aparecem em seção separada no dashboard'
                  }
                </small>
              </div>

              {formData.isFamily && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Quem Pagou? 👤
                  </label>
                  <select
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Selecione...</option>
                    {members.map(member => (
                      <option key={member._id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                  {members.length === 0 && (
                    <small style={{ color: '#e74c3c', fontSize: '11px' }}>
                      Cadastre membros no Painel Admin primeiro
                    </small>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Formulário - Recorrente */}
      {showRecurringForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>
                {editingRecurring ? 'Editar Gasto Recorrente' : 'Novo Gasto Recorrente'}
              </h3>
              <button
                onClick={() => { setShowRecurringForm(false); resetRecurringForm() }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRecurringSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Descrição *
                </label>
                <input
                  type="text"
                  value={recurringFormData.description}
                  onChange={(e) => setRecurringFormData({ ...recurringFormData, description: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Ex: Aluguel"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={recurringFormData.amount}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Dia do Mês * (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={recurringFormData.dayOfMonth}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, dayOfMonth: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Categoria *
                </label>
                <select
                  value={recurringFormData.category}
                  onChange={(e) => setRecurringFormData({ ...recurringFormData, category: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="Moradia">Moradia (Aluguel/Condomínio)</option>
                  <option value="Energia">Energia</option>
                  <option value="Água">Água</option>
                  <option value="Internet">Internet</option>
                  <option value="Telefone">Telefone</option>
                  <option value="TV/Streaming">TV/Streaming</option>
                  <option value="Assinaturas">Assinaturas</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Tipo de Gasto
                </label>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  backgroundColor: '#f0f0f0',
                  padding: '4px',
                  borderRadius: '8px',
                  width: '100%'
                }}>
                  <button
                    type="button"
                    onClick={() => setRecurringFormData({ ...recurringFormData, isFamily: false, paidBy: '' })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      backgroundColor: !recurringFormData.isFamily ? '#2ecc71' : 'transparent',
                      color: !recurringFormData.isFamily ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    👤 Pessoal
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringFormData({ ...recurringFormData, isFamily: true })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      backgroundColor: recurringFormData.isFamily ? '#3498db' : 'transparent',
                      color: recurringFormData.isFamily ? 'white' : '#666',
                      transition: 'all 0.2s'
                    }}
                  >
                    👨‍👩‍👧‍👦 Familiar
                  </button>
                </div>
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  {recurringFormData.isFamily 
                    ? 'Gastos familiares aparecem nas KPIs por membro'
                    : 'Gastos pessoais aparecem em seção separada no dashboard'
                  }
                </small>
              </div>

              {recurringFormData.isFamily && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Quem Pagou? 👤
                  </label>
                  <select
                    value={recurringFormData.paidBy}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, paidBy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Selecione...</option>
                    {members.map(member => (
                      <option key={member._id} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                  {members.length === 0 && (
                    <small style={{ color: '#e74c3c', fontSize: '11px' }}>
                      Cadastre membros no Painel Admin primeiro
                    </small>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={recurringFormData.isActive}
                    onChange={(e) => setRecurringFormData({ ...recurringFormData, isActive: e.target.checked })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>Ativo (gerar transações automaticamente)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setShowRecurringForm(false); resetRecurringForm() }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

