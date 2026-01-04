import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { transactionsService, groupsService, installmentsService, accountsService, creditCardsService } from '../services/api'
import { Transaction, Group, Installment, Account, CreditCard } from '../types'
import { formatCurrency, formatDate } from '../utils/format'
import TransactionForm from '../components/transactions/TransactionForm'

export default function MonthlyExpenses() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [installments, setInstallments] = useState<Installment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  )
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>()

  useEffect(() => {
    loadGroups()
    loadAccounts()
    loadCreditCards()
  }, [])

  useEffect(() => {
    if (user) {
      loadTransactions()
      loadInstallments()
    }
  }, [selectedMonth, selectedGroup, user])

  const loadGroups = async () => {
    try {
      const response = await groupsService.getAll()
      setGroups(response.data)
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    }
  }

  const loadAccounts = async () => {
    try {
      const response = await accountsService.getAll()
      setAccounts(response.data.accounts || response.data || [])
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
      setAccounts([])
    }
  }

  const loadCreditCards = async () => {
    try {
      const response = await creditCardsService.getAll()
      setCreditCards(response.data.creditCards || response.data || [])
    } catch (error) {
      console.error('Erro ao carregar cartões:', error)
      setCreditCards([])
    }
  }

  const loadInstallments = async () => {
    try {
      const params: any = {
        status: 'active',
        month: selectedMonth
      }

      if (selectedGroup) {
        params.groupId = selectedGroup
      }

      const response = await installmentsService.getAll(params)
      setInstallments(response.data)
    } catch (error) {
      console.error('Erro ao carregar parcelamentos:', error)
    }
  }

  const loadTransactions = async () => {
    try {
      setLoading(true)
      const startDate = new Date(`${selectedMonth}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

      const params: any = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'expense'
      }

      if (selectedGroup) {
        params.groupId = selectedGroup
      }

      const response = await transactionsService.getAll(params)
      setTransactions(response.data)
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      await transactionsService.delete(id)
      loadTransactions()
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      alert('Erro ao excluir transação')
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingTransaction(undefined)
    loadTransactions()
  }

  // Separar transações por natureza
  const fixedExpenses = transactions.filter(t => t.nature === 'fixed')
  const variableExpenses = transactions.filter(t => t.nature === 'variable')

  const totalFixed = fixedExpenses.reduce((sum, t) => sum + t.amount, 0)
  const totalVariable = variableExpenses.reduce((sum, t) => sum + t.amount, 0)
  
  // Calcular total de parcelamentos do mês
  const totalInstallments = installments.reduce((sum, inst) => {
    const installmentAmount = inst.totalAmount / inst.installments
    return sum + installmentAmount
  }, 0)
  
  const totalGeneral = totalFixed + totalVariable + totalInstallments

  // Calcular qual parcela está vencendo no mês selecionado
  const getInstallmentNumber = (installment: Installment) => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const startDate = new Date(installment.startDate)
    const startYear = startDate.getFullYear()
    const startMonth = startDate.getMonth() + 1
    
    const monthsPassed = (year - startYear) * 12 + (month - startMonth)
    return monthsPassed + 1 // Parcela atual (1-indexed)
  }

  const renderTransactionList = (items: Transaction[], title: string, color: string) => (
    <div style={{ 
      backgroundColor: 'white', 
      padding: '20px', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: `3px solid ${color}`,
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color }}>{title}</h3>
        <span style={{ 
          fontSize: '20px', 
          fontWeight: 'bold',
          color 
        }}>
          {formatCurrency(items.reduce((sum, t) => sum + t.amount, 0))}
        </span>
      </div>

      {items.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
          Nenhum gasto {title.toLowerCase()} neste mês
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>Data</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Descrição</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Categoria</th>
              <th style={{ textAlign: 'right', padding: '10px' }}>Valor</th>
              <th style={{ textAlign: 'center', padding: '10px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map(transaction => (
              <tr key={transaction._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px' }}>
                  {formatDate(transaction.date)}
                </td>
                <td style={{ padding: '10px' }}>{transaction.description}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#f0f0f0',
                    fontSize: '12px'
                  }}>
                    {transaction.category}
                  </span>
                </td>
                <td style={{ 
                  padding: '10px', 
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#e74c3c'
                }}>
                  {formatCurrency(transaction.amount)}
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleEdit(transaction)}
                    style={{
                      padding: '5px 10px',
                      marginRight: '5px',
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
                    onClick={() => handleDelete(transaction._id)}
                    style={{
                      padding: '5px 10px',
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: 0 }}>💰 Gastos Mensais</h2>
        <button
          onClick={() => setShowForm(true)}
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
          + Nova Despesa
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
            Mês
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Visualização
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

      {/* Resumo Geral */}
      <div style={{
        backgroundColor: '#34495e',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Total Gastos Fixos:</span>
          <strong style={{ fontSize: '18px' }}>{formatCurrency(totalFixed)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Total Gastos Variáveis:</span>
          <strong style={{ fontSize: '18px' }}>{formatCurrency(totalVariable)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Total Parcelamentos:</span>
          <strong style={{ fontSize: '18px' }}>{formatCurrency(totalInstallments)}</strong>
        </div>
        <div style={{ 
          borderTop: '2px solid rgba(255,255,255,0.3)', 
          paddingTop: '10px',
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '18px' }}>TOTAL GERAL:</span>
          <strong style={{ fontSize: '24px' }}>{formatCurrency(totalGeneral)}</strong>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Carregando...</p>
        </div>
      ) : (
        <>
          {/* Parcelamentos */}
          {installments.length > 0 && (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '15px',
                borderBottom: '3px solid #f39c12',
                paddingBottom: '10px'
              }}>
                <h3 style={{ margin: 0, color: '#f39c12' }}>💳 Parcelamentos</h3>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold',
                  color: '#f39c12'
                }}>
                  {formatCurrency(totalInstallments)}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #eee' }}>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Descrição</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Categoria</th>
                    <th style={{ textAlign: 'center', padding: '10px' }}>Parcela</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Valor</th>
                    <th style={{ textAlign: 'right', padding: '10px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map(installment => {
                    const installmentAmount = installment.totalAmount / installment.installments
                    const currentInstallment = getInstallmentNumber(installment)
                    
                    return (
                      <tr key={installment._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '10px' }}>
                          {installment.description}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f0f0f0',
                            fontSize: '12px'
                          }}>
                            {installment.category}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: '#f39c12',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            Parcela {currentInstallment}/{installment.installments}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '10px', 
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: '#e74c3c'
                        }}>
                          {formatCurrency(installmentAmount)}
                        </td>
                        <td style={{ 
                          padding: '10px', 
                          textAlign: 'right',
                          fontSize: '12px',
                          color: '#999'
                        }}>
                          de {formatCurrency(installment.totalAmount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {renderTransactionList(fixedExpenses, '📌 Gastos Fixos', '#e67e22')}
          {renderTransactionList(variableExpenses, '🔄 Gastos Variáveis', '#9b59b6')}
        </>
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
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>{editingTransaction ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingTransaction(undefined)
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
            <TransactionForm
              transaction={editingTransaction ? {
                ...editingTransaction,
                accountId: editingTransaction.accountId ? accounts.find(a => a._id === editingTransaction.accountId) : undefined,
                creditCardId: editingTransaction.creditCardId ? creditCards.find(c => c._id === editingTransaction.creditCardId) : undefined
              } : undefined}
              accounts={accounts}
              creditCards={creditCards}
              groups={groups}
              onSuccess={() => handleFormClose()}
              onClose={handleFormClose}
            />
          </div>
        </div>
      )}
    </div>
  )
}
