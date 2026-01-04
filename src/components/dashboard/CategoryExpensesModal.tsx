import React, { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { Transaction, FamilyMember } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

interface CategoryExpensesModalProps {
  category: string
  expenses: Transaction[]
  members: FamilyMember[]
  color: string
  onClose: () => void
}

type FilterType = 'all' | 'family' | 'personal'

export default function CategoryExpensesModal({ 
  category, 
  expenses, 
  members, 
  color,
  onClose 
}: CategoryExpensesModalProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  // Filtrar gastos
  const filteredExpenses = useMemo(() => {
    if (filter === 'all') return expenses
    if (filter === 'family') return expenses.filter(e => e.isFamily)
    return expenses.filter(e => !e.isFamily)
  }, [expenses, filter])

  const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const familyTotal = expenses.filter(e => e.isFamily).reduce((sum, exp) => sum + exp.amount, 0)
  const personalTotal = expenses.filter(e => !e.isFamily).reduce((sum, exp) => sum + exp.amount, 0)

  const getMemberColor = (memberName: string) => {
    return members.find(m => m.name === memberName)?.color || '#95a5a6'
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
            maxWidth: '800px',
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
            backgroundColor: `${color}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {category.charAt(0)}
              </div>
              <div>
                <h2 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#2c3e50'
                }}>
                  {category}
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

          {/* Filtros e Resumo */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '2px solid #f0f0f0',
            backgroundColor: '#f8f9fa'
          }}>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  backgroundColor: filter === 'all' ? '#34495e' : 'white',
                  color: filter === 'all' ? 'white' : '#495057',
                  transition: 'all 0.2s',
                  border: filter === 'all' ? 'none' : '1px solid #ddd'
                }}
              >
                📋 Todos
              </button>
              {familyTotal > 0 && (
                <button
                  onClick={() => setFilter('family')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    backgroundColor: filter === 'family' ? '#3498db' : 'white',
                    color: filter === 'family' ? 'white' : '#495057',
                    transition: 'all 0.2s',
                    border: filter === 'family' ? 'none' : '1px solid #ddd'
                  }}
                >
                  👨‍👩‍👧‍👦 Familiar ({formatCurrency(familyTotal)})
                </button>
              )}
              {personalTotal > 0 && (
                <button
                  onClick={() => setFilter('personal')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    backgroundColor: filter === 'personal' ? '#2ecc71' : 'white',
                    color: filter === 'personal' ? 'white' : '#495057',
                    transition: 'all 0.2s',
                    border: filter === 'personal' ? 'none' : '1px solid #ddd'
                  }}
                >
                  👤 Pessoal ({formatCurrency(personalTotal)})
                </button>
              )}
            </div>

            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: `2px solid ${color}40`
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#666' }}>
                Total {filter === 'all' ? 'Geral' : filter === 'family' ? 'Familiar' : 'Pessoal'}
              </span>
              <span style={{ 
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: color 
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
            {filteredExpenses.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#999'
              }}>
                <p style={{ fontSize: '16px', margin: 0 }}>
                  Nenhum gasto {filter === 'family' ? 'familiar' : filter === 'personal' ? 'pessoal' : ''} encontrado nesta categoria
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredExpenses
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
                        e.currentTarget.style.borderColor = color
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
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              backgroundColor: expense.isFamily ? '#d1ecf1' : '#d4edda',
                              color: expense.isFamily ? '#0c5460' : '#155724',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}>
                              {expense.isFamily ? '👨‍👩‍👧‍👦 Familiar' : '👤 Pessoal'}
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
                      {expense.paidBy && expense.isFamily && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e9ecef' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            backgroundColor: getMemberColor(expense.paidBy),
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            Pago por: {expense.paidBy}
                          </span>
                        </div>
                      )}
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

