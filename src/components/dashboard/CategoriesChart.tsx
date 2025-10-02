import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { formatCurrency, formatPercentage } from '../../utils/format'
import { PieChart as PieChartIcon, BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
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

export default function CategoriesChart({ expensesData, incomeData }: CategoriesChartProps) {
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
  const totalCount = currentData.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, var(--white) 0%, #fafafa 100%)',
      border: '1px solid var(--gray-200)',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -1px rgb(0 0 0 / 0.03)'
    }}>
      {/* Header */}
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
            backgroundColor: dataType === 'expenses' ? 'var(--error)' : 'var(--success)',
            color: 'white'
          }}>
            {dataType === 'expenses' ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
          </div>
          <div>
            <h3 style={{
              color: 'var(--primary-dark)',
              fontSize: '1.125rem',
              fontWeight: '700',
              margin: 0
            }}>
              {dataType === 'expenses' ? 'Gastos por Categoria' : 'Receitas por Categoria'}
            </h3>
            <p style={{
              color: 'var(--gray-500)',
              fontSize: '0.75rem',
              margin: 0,
              fontWeight: '500'
            }}>
              {formatCurrency(totalAmount)} • {totalCount} transações
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {/* Data Type Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--gray-100)',
            borderRadius: '8px',
            padding: '2px'
          }}>
            <button
              onClick={() => setDataType('expenses')}
              style={{
                padding: '0.5rem 0.75rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: dataType === 'expenses' ? 'var(--error)' : 'transparent',
                color: dataType === 'expenses' ? 'white' : 'var(--gray-600)',
                transition: 'all 0.2s ease'
              }}
            >
              Gastos
            </button>
            <button
              onClick={() => setDataType('income')}
              style={{
                padding: '0.5rem 0.75rem',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: dataType === 'income' ? 'var(--success)' : 'transparent',
                color: dataType === 'income' ? 'white' : 'var(--gray-600)',
                transition: 'all 0.2s ease'
              }}
            >
              Receitas
            </button>
          </div>

          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--gray-100)',
            borderRadius: '8px',
            padding: '2px'
          }}>
            <button
              onClick={() => setViewMode('pie')}
              style={{
                padding: '0.5rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'pie' ? 'var(--primary-dark)' : 'transparent',
                color: viewMode === 'pie' ? 'white' : 'var(--gray-600)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PieChartIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode('bar')}
              style={{
                padding: '0.5rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                backgroundColor: viewMode === 'bar' ? 'var(--primary-dark)' : 'transparent',
                color: viewMode === 'bar' ? 'white' : 'var(--gray-600)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                outerRadius={100}
                innerRadius={30}
                fill="#8884d8"
                dataKey="value"
                stroke="var(--white)"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={formatTooltipValue}
                labelStyle={{ color: 'var(--gray-700)', fontWeight: '600' }}
                contentStyle={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
                  padding: '1rem'
                }}
              />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--gray-400)"
                fontSize={11}
                fontWeight="500"
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
                labelStyle={{ color: 'var(--gray-700)', fontWeight: '600' }}
                contentStyle={{
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
                  padding: '1rem'
                }}
              />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                fill={dataType === 'expenses' ? 'var(--error)' : 'var(--success)'}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Category List */}
      {viewMode === 'pie' && chartData.length > 0 && (
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--gray-100)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem'
          }}>
            {chartData.slice(0, 6).map((item, index) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  backgroundColor: 'var(--gray-50)',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--gray-100)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--gray-50)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: item.color,
                  borderRadius: '2px'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)',
                    lineHeight: 1
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '0.625rem',
                    color: 'var(--gray-500)',
                    lineHeight: 1
                  }}>
                    {formatPercentage(item.percentage)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {chartData.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: 'var(--gray-500)',
          fontSize: '0.875rem'
        }}>
          {dataType === 'expenses' ? (
            <>
              <TrendingDown size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              Nenhuma despesa encontrada para este período
            </>
          ) : (
            <>
              <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              Nenhuma receita encontrada para este período
            </>
          )}
        </div>
      )}
    </div>
  )
}
