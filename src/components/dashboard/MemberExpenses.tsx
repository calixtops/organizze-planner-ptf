import React from 'react'
import { FamilyMember } from '../../types'
import { formatCurrency } from '../../utils/format'

interface MemberExpensesProps {
  memberExpenses: Array<{
    member: string
    amount: number
    color?: string
  }>
  members: FamilyMember[]
  totalExpenses: number
}

export default function MemberExpenses({ memberExpenses, members, totalExpenses }: MemberExpensesProps) {
  if (memberExpenses.length === 0) {
    return null
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold' }}>
        👥 Gastos por Membro da Família
      </h3>
      
      <div style={{ display: 'grid', gap: '15px' }}>
        {memberExpenses.map((me, idx) => {
          const member = members.find(m => m.name === me.member)
          const percentage = totalExpenses > 0 ? (me.amount / totalExpenses * 100).toFixed(1) : 0
          
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                border: `2px solid ${member?.color || '#95a5a6'}20`
              }}
            >
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: member?.color || '#95a5a6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '22px',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {me.member.charAt(0).toUpperCase()}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    {me.member}
                  </span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>
                    {formatCurrency(me.amount)}
                  </span>
                </div>
                
                <div style={{ position: 'relative', height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${percentage}%`,
                    backgroundColor: member?.color || '#95a5a6',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                
                <div style={{ marginTop: '5px', fontSize: '12px', color: '#666', textAlign: 'right' }}>
                  {percentage}% do total
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#34495e',
        color: 'white',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Total Geral</span>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatCurrency(totalExpenses)}</span>
      </div>
    </div>
  )
}

