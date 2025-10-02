import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { formatCurrency } from '../../utils/format'
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react'

interface MonthlyTrendProps {
  data: {
    month: string
    income: number
    expenses: number
    balance?: number
  }[]
}

export default function MonthlyTrend({ data }: MonthlyTrendProps) {
  const formatTooltipValue = (value: number, name: string) => {
    const labels = {
      income: 'Receitas',
      expenses: 'Despesas',
      balance: 'Saldo'
    }
    return [formatCurrency(value), labels[name as keyof typeof labels]]
  }

  const formatTooltipLabel = (label: string) => {
    const months = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
      '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    }
    
    const [year, month] = label.split('-')
    return `${months[month as keyof typeof months]} ${year}`
  }

  // Calculate trend
  const calculateTrend = () => {
    if (data.length < 2) return { direction: 'neutral', percentage: 0 }
    
    const latest = data[data.length - 1]
    const previous = data[data.length - 2]
    
    if (latest.balance && previous.balance) {
      const change = ((latest.balance - previous.balance) / Math.abs(previous.balance)) * 100
      return {
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        percentage: Math.abs(change)
      }
    }
    
    return { direction: 'neutral', percentage: 0 }
  }

  const trend = calculateTrend()

  return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, var(--white) 0%, #fafafa 100%)',
      border: '1px solid var(--gray-200)',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -1px rgb(0 0 0 / 0.03)'
    }}>
      {/* Header with trend indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '6px',
            backgroundColor: 'var(--primary-dark)',
            color: 'white'
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <h3 style={{
              color: 'var(--primary-dark)',
              fontSize: '1.125rem',
              fontWeight: '700',
              margin: 0
            }}>
              Tendência Mensal
            </h3>
            <p style={{
              color: 'var(--gray-500)',
              fontSize: '0.75rem',
              margin: 0,
              fontWeight: '500'
            }}>
              Últimos 6 meses
            </p>
          </div>
        </div>
        
        {trend.direction !== 'neutral' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            backgroundColor: trend.direction === 'up' ? '#dcfce715' : '#fef2f215',
            color: trend.direction === 'up' ? 'var(--success)' : 'var(--error)',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.percentage.toFixed(1)}%
          </div>
        )}
      </div>
      
      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--error)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--error)" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
            <XAxis 
              dataKey="month" 
              stroke="var(--gray-400)"
              fontSize={11}
              fontWeight="500"
              tickFormatter={(value) => {
                const [year, month] = value.split('-')
                const months = {
                  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
                  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
                  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
                }
                return months[month as keyof typeof months] || month
              }}
            />
            <YAxis 
              stroke="var(--gray-400)"
              fontSize={11}
              fontWeight="500"
              tickFormatter={(value) => {
                if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
                if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
                return `R$ ${value}`
              }}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              labelFormatter={formatTooltipLabel}
              labelStyle={{ 
                color: 'var(--gray-700)', 
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}
              contentStyle={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--gray-200)',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
                padding: '1rem'
              }}
              cursor={{ stroke: 'var(--accent-orange)', strokeWidth: 2 }}
              active={true}
              allowEscapeViewBox={{ x: false, y: false }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--success)"
              strokeWidth={3}
              fill="url(#incomeGradient)"
              dot={{ fill: 'var(--success)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--success)', strokeWidth: 2, fill: 'white' }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="var(--error)"
              strokeWidth={3}
              fill="url(#expensesGradient)"
              dot={{ fill: 'var(--error)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--error)', strokeWidth: 2, fill: 'white' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2rem',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--gray-100)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--gray-600)'
        }}>
          <div style={{
            width: '12px',
            height: '3px',
            backgroundColor: 'var(--success)',
            borderRadius: '2px'
          }} />
          Receitas
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--gray-600)'
        }}>
          <div style={{
            width: '12px',
            height: '3px',
            backgroundColor: 'var(--error)',
            borderRadius: '2px'
          }} />
          Despesas
        </div>
      </div>
      
      {data.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: 'var(--gray-500)',
          fontSize: '0.875rem'
        }}>
          <Calendar size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          Nenhum dado encontrado para este período
        </div>
      )}
    </div>
  )
}
