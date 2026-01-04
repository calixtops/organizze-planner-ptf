import React, { useState, useMemo, useEffect } from 'react'
import { X } from 'lucide-react'
import { Transaction, FamilyMember } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import api from '../../services/api'

interface MemberExpensesModalProps {
  memberName: string
  members: FamilyMember[]
  onClose: () => void
}

export default function MemberExpensesModal({ 
  memberName, 
  members,
  onClose 
}: MemberExpensesModalProps) {
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const member = members.find(m => m.name === memberName)
  const memberColor = member?.color || '#95a5a6'

  useEffect(() => {
    loadMemberExpenses()
  }, [memberName])

  const loadMemberExpenses = async () => {
    try {
      setLoading(true)
      const params: any = {
        type: 'expense',
        isFamily: true,
        paidBy: memberName,
        limit: 1000
      }

      const response = await api.get('/transactions', { params })
      const transactions = response.data.transactions || response.data || []
      setExpenses(transactions)
    } catch (error) {
      console.error('Erro ao carregar gastos do membro:', error)
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  // Agrupar por categoria
  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, { expenses: Transaction[], total: number }> = {}
    expenses.forEach(exp => {
      const category = exp.category || 'Sem categoria'
      if (!grouped[category]) {
        grouped[category] = { expenses: [], total: 0 }
      }
      grouped[category].expenses.push(exp)
      grouped[category].total += exp.amount
    })
    return grouped
  }, [expenses])

  const categories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1].total - a[1].total)

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
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '0',
            width: '100%',
            maxWidth: '900px',
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
            backgroundColor: `${memberColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: memberColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '28px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {memberName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#2c3e50'
                }}>
                  {memberName}
                </h2>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '0.875rem',
                  color: '#666'
                }}>
                  {expenses.length} {expenses.length === 1 ? 'gasto encontrado' : 'gastos encontrados'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
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
              <X size={24} />
            </button>
          </div>

          {/* Resumo */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '2px solid #f0f0f0',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: `2px solid ${memberColor}40`
            }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#666' }}>
                Total de Gastos
              </span>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: memberColor 
              }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Lista de Gastos */}
          <div style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1
          }}>
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#999'
              }}>
                <p style={{ fontSize: '16px', margin: 0 }}>Carregando gastos...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#999'
              }}>
                <p style={{ fontSize: '16px', margin: 0 }}>
                  Nenhum gasto encontrado para {memberName}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Gastos por Categoria */}
                {categories.map(([category, { expenses: categoryExpenses, total: categoryTotal }]) => (
                  <div key={category} style={{
                    border: `2px solid ${memberColor}20`,
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    {/* Header da Categoria */}
                    <div style={{
                      padding: '12px 16px',
                      backgroundColor: `${memberColor}10`,
                      borderBottom: `1px solid ${memberColor}20`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        {category}
                      </span>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: memberColor
                      }}>
                        {formatCurrency(categoryTotal)} ({categoryExpenses.length} {categoryExpenses.length === 1 ? 'gasto' : 'gastos'})
                      </span>
                    </div>

                    {/* Lista de Gastos da Categoria */}
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {categoryExpenses
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((expense) => (
                          <div
                            key={expense._id}
                            style={{
                              padding: '1rem',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '10px',
                              border: '1px solid #e9ecef',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f7ff'
                              e.currentTarget.style.borderColor = memberColor
                              e.currentTarget.style.transform = 'translateX(4px)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f8f9fa'
                              e.currentTarget.style.borderColor = '#e9ecef'
                              e.currentTarget.style.transform = 'translateX(0)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{
                                  fontSize: '15px',
                                  fontWeight: '600',
                                  color: '#2c3e50',
                                  marginBottom: '4px'
                                }}>
                                  {expense.description}
                                  {expense.installmentInfo && (
                                    <span style={{
                                      marginLeft: '8px',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      backgroundColor: '#fff3cd',
                                      color: '#856404',
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold'
                                    }}>
                                      Parcela {expense.installmentInfo.current}/{expense.installmentInfo.total}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}>
                                    📅 {formatDate(expense.date)}
                                  </span>
                                  {expense.nature && (
                                    <span style={{
                                      padding: '4px 10px',
                                      borderRadius: '12px',
                                      backgroundColor: expense.nature === 'fixed' ? '#fff3cd' : '#e7f3ff',
                                      color: expense.nature === 'fixed' ? '#856404' : '#004085',
                                      fontSize: '11px',
                                      fontWeight: 'bold'
                                    }}>
                                      {expense.nature === 'fixed' ? '🏠 Fixo' : '💸 Variável'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#e74c3c',
                                textAlign: 'right'
                              }}>
                                {formatCurrency(expense.amount)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

