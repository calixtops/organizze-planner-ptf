import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency, formatPercentage } from '../../utils/format'
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react'
import { useState } from 'react'

interface CategoriesChartProps {
  expensesData: {
    _id: string
    total: number
    count: number
  }[]
  incomeData: {
    _id: string
    total: number
    count: number
  }[]
}

const COLORS = [
  '#f25924', // accent-orange
  '#3b82f6', // info
  '#22c55e', // success
  '#f59e0b', // warning
  '#ef4444', // error
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899'  // pink
]

export default function CategoriesChartNew({ expensesData, incomeData }: CategoriesChartProps) {
  const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie')
  const [dataType, setDataType] = useState<'expenses' | 'income'>('expenses')

  const formatTooltipValue = (value: number, _name: string, props: any) => {
    const percentage = props.payload?.percentage || 0
    return [formatCurrency(value), `${formatPercentage(percentage)}`]
  }

  const prepareChartData = (data: any[]) => {
    const total = data.reduce((sum, item) => sum + item.total, 0)
    
    return data.map((item, index) => ({
      ...item,
      name: item._id,
      value: item.total,
      percentage: total > 0 ? (item.total / total) * 100 : 0,
      color: COLORS[index % COLORS.length]
    }))
  }

  const currentData = dataType === 'expenses' ? expensesData : incomeData
  const chartData = prepareChartData(currentData)
  const totalAmount = currentData.reduce((sum, item) => sum + item.total, 0)

  if (chartData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--gray-500)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gray-600)' }}>
          Nenhum dado disponível
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          {dataType === 'expenses' ? 'Adicione algumas despesas' : 'Adicione algumas receitas'} para ver o gráfico
        </p>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setDataType('expenses')}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '6px',
              backgroundColor: dataType === 'expenses' ? 'var(--error)' : 'var(--white)',
              color: dataType === 'expenses' ? 'white' : 'var(--gray-700)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Despesas
          </button>
          <button
            onClick={() => setDataType('income')}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '6px',
              backgroundColor: dataType === 'income' ? 'var(--success)' : 'var(--white)',
              color: dataType === 'income' ? 'white' : 'var(--gray-700)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Receitas
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('pie')}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '6px',
              backgroundColor: viewMode === 'pie' ? 'var(--primary-dark)' : 'var(--white)',
              color: viewMode === 'pie' ? 'white' : 'var(--gray-700)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <PieChartIcon size={16} />
          </button>
          <button
            onClick={() => setViewMode('bar')}
            style={{
              padding: '0.5rem',
              border: '1px solid var(--gray-300)',
              borderRadius: '6px',
              backgroundColor: viewMode === 'bar' ? 'var(--primary-dark)' : 'var(--white)',
              color: viewMode === 'bar' ? 'white' : 'var(--gray-700)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltipValue} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
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
                  boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
                  fontSize: '14px'
                }}
                formatter={formatTooltipValue}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        backgroundColor: 'var(--gray-50)',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-800)' }}>
          {formatCurrency(totalAmount)}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          Total em {dataType === 'expenses' ? 'despesas' : 'receitas'}
        </div>
      </div>
    </div>
  )
}

