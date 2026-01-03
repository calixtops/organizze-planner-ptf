import React, { useState, useMemo } from 'react'
import { Transaction, FamilyMember } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'

interface MonthlyExpensesTableProps {
  expenses: Transaction[]
  members: FamilyMember[]
  loading?: boolean
}

type FilterType = 'all' | 'family' | 'personal'

export default function MonthlyExpensesTable({ expenses, members, loading }: MonthlyExpensesTableProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  // Filtrar gastos baseado no filtro selecionado
  const filteredExpenses = useMemo(() => {
    if (filter === 'all') return expenses
    if (filter === 'family') return expenses.filter(e => e.isFamily)
    return expenses.filter(e => !e.isFamily)
  }, [expenses, filter])

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <p style={{ color: '#999' }}>Carregando gastos...</p>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <p style={{ color: '#999', fontSize: '16px' }}>Nenhum gasto encontrado para este mês</p>
      </div>
    )
  }

  // Totais baseados nos gastos filtrados
  const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const familyTotal = filteredExpenses.filter(e => e.isFamily).reduce((sum, exp) => sum + exp.amount, 0)
  const personalTotal = filteredExpenses.filter(e => !e.isFamily).reduce((sum, exp) => sum + exp.amount, 0)

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header com resumo */}
      <div style={{
        padding: '20px 25px',
        backgroundColor: '#f8f9fa',
        borderBottom: '2px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
            💰 Gastos do Mês
          </h3>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#666', fontSize: '12px' }}>Total</div>
              <div style={{ fontWeight: 'bold', color: '#e74c3c', fontSize: '18px' }}>
                {formatCurrency(total)}
              </div>
            </div>
            {familyTotal > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#666', fontSize: '12px' }}>Familiar</div>
                <div style={{ fontWeight: 'bold', color: '#3498db', fontSize: '16px' }}>
                  {formatCurrency(familyTotal)}
                </div>
              </div>
            )}
            {personalTotal > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#666', fontSize: '12px' }}>Pessoal</div>
                <div style={{ fontWeight: 'bold', color: '#2ecc71', fontSize: '16px' }}>
                  {formatCurrency(personalTotal)}
                </div>
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                backgroundColor: filter === 'all' ? '#34495e' : '#e9ecef',
                color: filter === 'all' ? 'white' : '#495057',
                transition: 'all 0.2s'
              }}
            >
              📋 Todos
            </button>
            <button
              onClick={() => setFilter('family')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                backgroundColor: filter === 'family' ? '#3498db' : '#e9ecef',
                color: filter === 'family' ? 'white' : '#495057',
                transition: 'all 0.2s'
              }}
            >
              👨‍👩‍👧‍👦 Familiar
            </button>
            <button
              onClick={() => setFilter('personal')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                backgroundColor: filter === 'personal' ? '#2ecc71' : '#e9ecef',
                color: filter === 'personal' ? 'white' : '#495057',
                transition: 'all 0.2s'
              }}
            >
              👤 Pessoal
            </button>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            {filteredExpenses.length > 0 ? (
              <>
                Mostrando <strong>{filteredExpenses.length}</strong> de <strong>{expenses.length}</strong> {expenses.length === 1 ? 'gasto' : 'gastos'}
              </>
            ) : (
              <>
                Nenhum gasto {filter === 'family' ? 'familiar' : filter === 'personal' ? 'pessoal' : ''} encontrado
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#34495e',
              color: 'white'
            }}>
              <th style={{
                padding: '15px 20px',
                textAlign: 'left',
                fontWeight: 'bold',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Descrição
              </th>
              <th style={{
                padding: '15px 20px',
                textAlign: 'left',
                fontWeight: 'bold',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Categoria
              </th>
              <th style={{
                padding: '15px 20px',
                textAlign: 'left',
                fontWeight: 'bold',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Data
              </th>
              <th style={{
                padding: '15px 20px',
                textAlign: 'left',
                fontWeight: 'bold',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Tipo
              </th>
              <th style={{
                padding: '15px 20px',
                textAlign: 'left',
                fontWeight: 'bold',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Quem Pagou
              </th>
              <th style={{
                padding: '15px 20px',
                textAlign: 'right',
                fontWeight: 'bold',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  Nenhum gasto {filter === 'family' ? 'familiar' : filter === 'personal' ? 'pessoal' : ''} encontrado para este mês
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense, index) => {
                const member = expense.paidBy ? members.find(m => m.name === expense.paidBy) : null
                
                return (
                  <tr
                    key={expense._id}
                    style={{
                      borderBottom: index < filteredExpenses.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                      transition: 'background-color 0.2s'
                    }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f7ff'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#fafafa'
                  }}
                >
                  <td style={{
                    padding: '15px 20px',
                    fontWeight: '500',
                    color: '#2c3e50'
                  }}>
                    {expense.description}
                    {expense.installmentInfo && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        Parcela {expense.installmentInfo.current}/{expense.installmentInfo.total}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      backgroundColor: '#e9ecef',
                      color: '#495057',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {expense.category}
                    </span>
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    {formatDate(expense.date)}
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: expense.isFamily ? '#d1ecf1' : '#d4edda',
                      color: expense.isFamily ? '#0c5460' : '#155724'
                    }}>
                      {expense.isFamily ? '👨‍👩‍👧‍👦 Familiar' : '👤 Pessoal'}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px' }}>
                    {expense.isFamily && expense.paidBy ? (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: member?.color || '#95a5a6',
                        color: 'white'
                      }}>
                        {expense.paidBy}
                      </span>
                    ) : (
                      <span style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                        —
                      </span>
                    )}
                  </td>
                  <td style={{
                    padding: '15px 20px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#e74c3c',
                    fontSize: '15px'
                  }}>
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer com total */}
      <div style={{
        padding: '15px 25px',
        backgroundColor: '#f8f9fa',
        borderTop: '2px solid #e9ecef',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '13px', color: '#666' }}>
          {filter === 'all' ? (
            <>Total de {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}</>
          ) : (
            <>Mostrando {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'} {filter === 'family' ? 'familiar' : 'pessoal'}</>
          )}
        </div>
        <div style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#e74c3c'
        }}>
          {formatCurrency(total)}
        </div>
      </div>
    </div>
  )
}

