import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionsService, groupsService, familyMembersService } from '../services/api'
import { Transaction, Group, FamilyMember } from '../types'
import { formatCurrency, formatDate } from '../utils/format'

export default function VariableExpenses() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  )
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Transaction | null>(null)
  
  // Form simplificado
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Alimentação',
    date: new Date().toISOString().slice(0, 10),
    isFamily: false,
    paidBy: ''
  })

  useEffect(() => {
    loadGroups()
    loadMembers()
  }, [])

  useEffect(() => {
    if (user) loadExpenses()
  }, [user, selectedGroup, selectedMonth])

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

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const startDate = new Date(`${selectedMonth}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

      const params: any = {
        type: 'expense',
        nature: 'variable',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
      if (selectedGroup) params.groupId = selectedGroup
      
      const response = await transactionsService.getAll(params)
      
      // A API pode retornar { transactions: [...] } ou diretamente [...]
      const data = response.data.transactions || response.data
      setExpenses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar gastos correntes:', error)
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
        nature: 'variable' as const,
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
      category: 'Alimentação',
      date: new Date().toISOString().slice(0, 10),
      isFamily: false,
      paidBy: ''
    })
    setEditingExpense(null)
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>🛒 Gastos Correntes</h2>
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
          + Novo Gasto
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        display: 'flex',
        gap: '15px'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mês</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Grupo</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">Pessoal</option>
            {groups.map(group => (
              <option key={group._id} value={group._id}>{group.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumo */}
      <div style={{
        backgroundColor: '#9b59b6',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '18px' }}>Total do Mês:</span>
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
          <p>Nenhum gasto corrente neste mês</p>
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

      {/* Modal Formulário Simplificado */}
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
                {editingExpense ? 'Editar Gasto' : 'Novo Gasto Corrente'}
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
                  placeholder="Ex: Supermercado"
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
                  <option value="Alimentação">Alimentação</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Lazer">Lazer</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Educação">Educação</option>
                  <option value="Vestuário">Vestuário</option>
                  <option value="Beleza">Beleza</option>
                  <option value="Presentes">Presentes</option>
                  <option value="Pet">Pet</option>
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
    </div>
  )
}

