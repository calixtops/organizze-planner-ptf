import React from 'react'
import { formatCurrency } from '../../utils/format'

interface ExpenseSummaryCardProps {
  title: string
  amount: number
  icon: string
  color: string
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function ExpenseSummaryCard({ 
  title, 
  amount, 
  icon, 
  color, 
  subtitle,
  trend 
}: ExpenseSummaryCardProps) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '32px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
      border: `2px solid ${color}20`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-6px)'
      e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
    }}
    >
      {/* Barra colorida no topo */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '5px',
        backgroundColor: color
      }} />
      
      <div>
        <div style={{ fontSize: '16px', color: 'var(--gray-600)', fontWeight: '600', marginBottom: '12px' }}>
          {title}
        </div>
        <div style={{ fontSize: '42px', fontWeight: 'bold', color: color, lineHeight: '1.2' }}>
          {formatCurrency(amount)}
        </div>
        {subtitle && (
          <div style={{ fontSize: '14px', color: 'var(--gray-500)', marginTop: '8px' }}>
            {subtitle}
          </div>
        )}
      </div>
      
      {trend && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: trend.isPositive ? '#2ecc71' : '#e74c3c'
        }}>
          <span>{trend.isPositive ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}% vs mês anterior</span>
        </div>
      )}
    </div>
  )
}

