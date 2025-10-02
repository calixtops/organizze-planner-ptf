import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line } from 'recharts'
import { formatCurrency } from '../../utils/format'

interface MonthlyTrendProps {
  data: {
    month: string
    income: number
    expenses: number
    balance?: number
  }[]
}

export default function MonthlyTrendNew({ data }: MonthlyTrendProps) {
  const formatTooltipValue = (value: number, name: string) => {
    const labels = {
      income: 'Receitas',
      expenses: 'Despesas',
      balance: 'Saldo'
    }
    return [formatCurrency(value), labels[name as keyof typeof labels]]
  }

  const formatTooltipLabel = (label: string) => {
    return label
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.5} />
          <XAxis 
            dataKey="month" 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#666' }}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#666' }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
              if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
              return `R$ ${value}`
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid var(--gray-200)',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(8px)',
              fontSize: '14px'
            }}
            formatter={formatTooltipValue}
            labelFormatter={formatTooltipLabel}
            cursor={{ stroke: 'var(--accent-orange)', strokeWidth: 2, strokeDasharray: '5 5' }}
            active={true}
            allowEscapeViewBox={{ x: false, y: false }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stackId="1"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#incomeGradient)"
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stackId="2"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#expensesGradient)"
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#2f2b36"
            strokeWidth={3}
            dot={{ fill: '#2f2b36', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: '#2f2b36', strokeWidth: 2, fill: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

