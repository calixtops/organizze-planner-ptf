import { useState, useEffect } from 'react'
import { formatCurrency } from '../../utils/format'
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react'

interface BalanceCardProps {
  title: string
  value: number
  icon: string
  color: string
  trend?: number
  trendType?: 'up' | 'down'
}

export default function BalanceCard({ title, value, icon, color, trend, trendType }: BalanceCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value)
    }, 100)
    return () => clearTimeout(timer)
  }, [value])

  const getIconComponent = () => {
    switch (icon) {
      case '💰':
        return <DollarSign size={24} />
      case '📈':
        return <TrendingUp size={24} />
      case '📉':
        return <TrendingDown size={24} />
      case '⚖️':
        return <CreditCard size={24} />
      default:
        return <span style={{ fontSize: '1.5rem' }}>{icon}</span>
    }
  }

  return (
    <div className="card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      border: '1px solid var(--gray-200)',
      background: 'linear-gradient(135deg, var(--white) 0%, #fafafa 100%)',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -1px rgb(0 0 0 / 0.03)',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -1px rgb(0 0 0 / 0.03)'
    }}>
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`
      }} />
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h3 style={{
          color: 'var(--gray-700)',
          fontSize: '0.875rem',
          fontWeight: '600',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </h3>
        <div style={{
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          backgroundColor: `${color}15`,
          transition: 'all 0.3s ease'
        }}>
          {getIconComponent()}
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.5rem'
      }}>
        <div style={{
          fontSize: '2rem',
          fontWeight: '800',
          color: color,
          lineHeight: 1,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {formatCurrency(animatedValue)}
        </div>
        
        {trend && trendType && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: trendType === 'up' ? 'var(--success)' : 'var(--error)',
            backgroundColor: trendType === 'up' ? '#dcfce715' : '#fef2f215',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px'
          }}>
            {trendType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Progress bar for visual appeal */}
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: 'var(--gray-100)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: '100%',
          backgroundColor: color,
          borderRadius: '2px',
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          animation: 'progressBar 2s ease-out forwards'
        }} />
      </div>

    </div>
  )
}
