import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { installmentsService, groupsService, familyMembersService } from '../services/api'
import { Installment, Group, FamilyMember } from '../types'
import { formatCurrency, formatDate } from '../utils/format'

export default function Installments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [showForm, setShowForm] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    installments: '',
    category: 'Compras',
    startDate: new Date().toISOString().slice(0, 10),
    paymentDay: '10',
    isFamily: false,
    paidBy: '',
    initialPaid: '', // Parcelas já pagas manualmente
    autoMarkPaid: true // Calcular automaticamente baseado na data
  })

  useEffect(() => {
    loadGroups()
    loadMembers()
  }, [])

  useEffect(() => {
    if (user) {
      loadInstallments()
    }
  }, [statusFilter, selectedGroup, user])

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

  const loadInstallments = async () => {
    try {
      setLoading(true)
      const params: any = {}

      if (statusFilter) {
        params.status = statusFilter
      }

      if (selectedGroup) {
        params.groupId = selectedGroup
      }

      const response = await installmentsService.getAll(params)
      setInstallments(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error('Erro ao carregar parcelamentos:', error)
      setInstallments([])
    } finally {
      setLoading(false)
    }
  }

  // Função para calcular quantas parcelas já deveriam ter sido pagas
  const calculateAutoPaid = (startDate: string, paymentDay: number, totalInstallments: number): number => {
    const now = new Date()
    const start = new Date(startDate)
    
    if (start > now) return 0

    const yearsDiff = now.getFullYear() - start.getFullYear()
    const monthsDiff = now.getMonth() - start.getMonth()
    const daysDiff = now.getDate() - start.getDate()
    
    let totalMonths = yearsDiff * 12 + monthsDiff
    
    if (daysDiff >= 0 && now.getDate() >= paymentDay) {
      totalMonths += 1
    }
    
    return Math.min(Math.max(0, totalMonths), totalInstallments)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const totalInstallments = parseInt(formData.installments)
      const paymentDay = parseInt(formData.paymentDay)
      
      // Calcular parcelas pagas
      let paidCount: number | undefined = undefined
      
      if (formData.initialPaid && formData.initialPaid !== '') {
        // Se o usuário especificou manualmente
        paidCount = Math.min(Math.max(0, parseInt(formData.initialPaid)), totalInstallments)
      } else if (formData.autoMarkPaid) {
        // Calcular automaticamente
        paidCount = calculateAutoPaid(formData.startDate, paymentDay, totalInstallments)
      }

      const data: any = {
        ...formData,
        totalAmount: parseFloat(formData.totalAmount),
        installments: totalInstallments,
        paymentDay: paymentDay,
        isFamily: formData.isFamily,
        paidBy: formData.paidBy || undefined
      }

      // Adicionar campos de parcelas pagas apenas na criação
      if (!editingInstallment) {
        if (paidCount !== undefined) {
          data.initialPaid = paidCount
        }
        data.autoMarkPaid = formData.autoMarkPaid
      }

      if (editingInstallment) {
        await installmentsService.update(editingInstallment._id, data)
        alert('Parcelamento atualizado com sucesso!')
      } else {
        const response = await installmentsService.create(data)
        if (response.data.message) {
          alert(response.data.message)
        }
      }

      setShowForm(false)
      resetForm()
      loadInstallments()
    } catch (error: any) {
      console.error('Erro ao salvar parcelamento:', error)
      alert(error.response?.data?.error || 'Erro ao salvar parcelamento')
    }
  }

  const handlePay = async (id: string) => {
    try {
      await installmentsService.pay(id)
      loadInstallments()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao marcar parcela como paga')
    }
  }

  const handleCancel = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este parcelamento?')) return

    try {
      await installmentsService.cancel(id)
      loadInstallments()
    } catch (error) {
      alert('Erro ao cancelar parcelamento')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este parcelamento?')) return

    try {
      await installmentsService.delete(id)
      loadInstallments()
    } catch (error) {
      alert('Erro ao excluir parcelamento')
    }
  }

  const handleEdit = (installment: Installment) => {
    setEditingInstallment(installment)
    setFormData({
      description: installment.description,
      totalAmount: installment.totalAmount.toString(),
      installments: installment.installments.toString(),
      category: installment.category,
      startDate: new Date(installment.startDate).toISOString().slice(0, 10),
      paymentDay: installment.paymentDay.toString(),
      isFamily: installment.isFamily || false,
      paidBy: installment.paidBy || '',
      initialPaid: installment.currentPaid.toString(),
      autoMarkPaid: false // Ao editar, não calcular automaticamente
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      description: '',
      totalAmount: '',
      installments: '',
      category: 'Compras',
      startDate: new Date().toISOString().slice(0, 10),
      paymentDay: '10',
      isFamily: false,
      paidBy: '',
      initialPaid: '',
      autoMarkPaid: true
    })
    setEditingInstallment(null)
  }

  const getStatusBadge = (status: string) => {
    const colors: any = {
      active: { bg: '#3498db', text: 'white' },
      completed: { bg: '#2ecc71', text: 'white' },
      cancelled: { bg: '#95a5a6', text: 'white' }
    }
    const labels: any = {
      active: 'Ativo',
      completed: 'Completo',
      cancelled: 'Cancelado'
    }
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        backgroundColor: colors[status]?.bg || '#999',
        color: colors[status]?.text || 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {labels[status] || status}
      </span>
    )
  }

  const calculateInstallmentAmount = (totalAmount: number, installments: number) => {
    return totalAmount / installments
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>💳 Parcelamentos</h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          + Novo Parcelamento
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
        gap: '15px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="">Todos</option>
            <option value="active">Ativos</option>
            <option value="completed">Completos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Grupo
          </label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="">Pessoal</option>
            {groups.map(group => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Parcelamentos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Carregando...</p>
        </div>
      ) : installments.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#999'
        }}>
          <p>Nenhum parcelamento encontrado</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {installments.map(installment => {
            const installmentAmount = calculateInstallmentAmount(
              installment.totalAmount,
              installment.installments
            )
            const remaining = installment.installments - installment.currentPaid
            const paidAmount = installmentAmount * installment.currentPaid
            const remainingAmount = installment.totalAmount - paidAmount

            return (
              <div
                key={installment._id}
                style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: installment.status === 'active' ? '2px solid #3498db' : '1px solid #eee'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{installment.description}</h3>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#f0f0f0',
                      fontSize: '12px',
                      marginRight: '10px'
                    }}>
                      {installment.category}
                    </span>
                    {getStatusBadge(installment.status)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                      {formatCurrency(installment.totalAmount)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {installment.installments}x de {formatCurrency(installmentAmount)}
                    </div>
                  </div>
                </div>

                {/* Progresso */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                    <span>
                      {installment.currentPaid > 0 
                        ? `Parcela ${installment.currentPaid + 1}/${installment.installments} (Próxima)`
                        : `Parcela 1/${installment.installments}`
                      }
                    </span>
                    <span>
                      {remaining > 0 
                        ? `Restam ${remaining} parcelas - ${formatCurrency(remainingAmount)}`
                        : 'Todas as parcelas pagas!'
                      }
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#ecf0f1',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(installment.currentPaid / installment.installments) * 100}%`,
                      height: '100%',
                      backgroundColor: installment.status === 'completed' ? '#2ecc71' : '#3498db',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    {installment.currentPaid > 0 && (
                      <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                        ✓ {installment.currentPaid} parcela(s) paga(s)
                      </span>
                    )}
                    {installment.currentPaid === 0 && (
                      <span style={{ color: '#e74c3c' }}>
                        ⚠ Nenhuma parcela paga ainda
                      </span>
                    )}
                  </div>
                </div>

                {/* Informações adicionais */}
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                  <div>📅 Início: {formatDate(installment.startDate)}</div>
                  <div>📆 Dia de vencimento: {installment.paymentDay}</div>
                  {installment.groupId && (
                    <div>👥 Grupo: {groups.find(g => g._id === installment.groupId)?.name || 'Grupo'}</div>
                  )}
                  {installment.paidBy && (
                    <div style={{ marginTop: '5px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        backgroundColor: members.find(m => m.name === installment.paidBy)?.color || '#95a5a6',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        👤 Pago por: {installment.paidBy}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  {installment.status === 'active' && (
                    <button
                      onClick={() => handlePay(installment._id)}
                      disabled={installment.currentPaid >= installment.installments}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: installment.currentPaid >= installment.installments ? '#95a5a6' : '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: installment.currentPaid >= installment.installments ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}
                    >
                      ✓ Marcar Paga
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(installment)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Editar
                  </button>
                  {installment.status === 'active' && (
                    <button
                      onClick={() => handleCancel(installment._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f39c12',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(installment._id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal do Formulário */}
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
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>
                {editingInstallment ? 'Editar Parcelamento' : 'Novo Parcelamento'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
                }}
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
                  placeholder="Ex: Notebook Dell"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Valor Total *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
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
                    Nº Parcelas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.installments}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="12"
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
                  <option value="Compras">Compras</option>
                  <option value="Eletrônicos">Eletrônicos</option>
                  <option value="Móveis">Móveis</option>
                  <option value="Viagem">Viagem</option>
                  <option value="Educação">Educação</option>
                  <option value="Saúde">Saúde</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Data Início *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Dia Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.paymentDay}
                    onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                    placeholder="10"
                  />
                </div>
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
                    Quem Está Pagando? 👤
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
                      <option key={member._id} value={member.name}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  {members.length === 0 && (
                    <small style={{ color: '#e74c3c', fontSize: '11px', display: 'block', marginTop: '5px' }}>
                      Cadastre membros no Painel Admin primeiro
                    </small>
                  )}
                </div>
              )}

              {/* Seção de Parcelas Já Pagas - apenas na criação */}
              {!editingInstallment && (
                <>
                  <div style={{
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.autoMarkPaid}
                        onChange={(e) => {
                          setFormData({ ...formData, autoMarkPaid: e.target.checked, initialPaid: '' })
                        }}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 'bold' }}>Calcular automaticamente parcelas já pagas</span>
                    </label>
                    <small style={{ color: '#666', fontSize: '12px', marginLeft: '30px', display: 'block' }}>
                      Baseado na data de início, o sistema calculará quantas parcelas já deveriam ter sido pagas
                    </small>
                    
                    {formData.autoMarkPaid && formData.startDate && formData.installments && formData.paymentDay && (
                      <div style={{ marginTop: '10px', marginLeft: '30px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px' }}>
                        <strong style={{ color: '#2ecc71' }}>
                          ⚡ {calculateAutoPaid(
                            formData.startDate,
                            parseInt(formData.paymentDay) || 10,
                            parseInt(formData.installments) || 0
                          )} parcela(s) serão marcadas como pagas automaticamente
                        </strong>
                      </div>
                    )}
                  </div>

                  {!formData.autoMarkPaid && (
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Parcelas Já Pagas (Opcional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={formData.installments ? parseInt(formData.installments) : 0}
                        value={formData.initialPaid}
                        onChange={(e) => setFormData({ ...formData, initialPaid: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          boxSizing: 'border-box'
                        }}
                        placeholder="0"
                      />
                      <small style={{ color: '#666', fontSize: '12px' }}>
                        Se você já pagou algumas parcelas, informe quantas aqui
                      </small>
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
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

