import React, { useState } from 'react'
import { Transaction, FamilyMember } from '../../types'
import { formatCurrency } from '../../utils/format'
import CategoryExpensesModal from './CategoryExpensesModal'

interface CategoryBreakdownProps {
  expenses: Transaction[]
  members?: FamilyMember[]
}

export default function CategoryBreakdown({ expenses, members = [] }: CategoryBreakdownProps) {
  const [selectedCategory, setSelectedCategory] = useState<{ category: string, color: string } | null>(null)

  // Agrupar por categoria
  const categoryMap = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = 0
    }
    acc[exp.category] += exp.amount
    return acc
  }, {} as Record<string, number>)

  const categories = Object.entries(categoryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6) // Top 6 categorias

  const total = categories.reduce((sum, cat) => sum + cat.amount, 0)

  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'
  ]

  const handleCategoryClick = (category: string, index: number) => {
    const categoryExpenses = expenses.filter(exp => exp.category === category)
    if (categoryExpenses.length > 0) {
      setSelectedCategory({ category, color: colors[index % colors.length] })
    }
  }

  if (categories.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'center',
        color: '#999'
      }}>
        Nenhum gasto por categoria
      </div>
    )
  }

  return (
    <>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0'
      }}>
        <h3 style={{ margin: '0 0 25px 0', fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
          🎯 Top Categorias
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categories.map((cat, index) => {
            const percentage = (cat.amount / total) * 100
            const color = colors[index % colors.length]
            const categoryExpenses = expenses.filter(exp => exp.category === cat.category)

            return (
              <div 
                key={cat.category} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  cursor: categoryExpenses.length > 0 ? 'pointer' : 'default'
                }}
                onClick={() => categoryExpenses.length > 0 && handleCategoryClick(cat.category, index)}
                onMouseEnter={(e) => {
                  if (categoryExpenses.length > 0) {
                    e.currentTarget.style.opacity = '0.8'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      backgroundColor: color,
                      flexShrink: 0
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                      {cat.category}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#999', minWidth: '50px', textAlign: 'right' }}>
                      {percentage.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#2c3e50', minWidth: '100px', textAlign: 'right' }}>
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                </div>
                <div style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: color,
                    borderRadius: '5px',
                    transition: 'width 0.5s ease-out',
                    boxShadow: `0 0 10px ${color}40`
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {categories.length < Object.keys(categoryMap).length && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            +{Object.keys(categoryMap).length - categories.length} outra(s) categoria(s)
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedCategory && (
        <CategoryExpensesModal
          category={selectedCategory.category}
          expenses={expenses.filter(exp => exp.category === selectedCategory.category)}
          members={members}
          color={selectedCategory.color}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </>
  )
}

