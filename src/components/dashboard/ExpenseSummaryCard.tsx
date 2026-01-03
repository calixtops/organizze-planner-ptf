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
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: `2px solid ${color}20`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
    }}
    >
      {/* Barra colorida no topo */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: color
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: '500', marginBottom: '8px' }}>
            {title}
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: color }}>
            {formatCurrency(amount)}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{
          fontSize: '36px',
          width: '60px',
          height: '60px',
          borderRadius: '12px',
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
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

