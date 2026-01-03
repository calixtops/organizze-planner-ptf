import React from 'react'
import { formatCurrency } from '../../utils/format'

interface ExpenseDistributionProps {
  fixed: number
  variable: number
  installments: number
}

export default function ExpenseDistribution({ fixed, variable, installments }: ExpenseDistributionProps) {
  const total = fixed + variable + installments
  
  if (total === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'center',
        color: '#999'
      }}>
        Nenhum gasto registrado
      </div>
    )
  }

  const fixedPercent = (fixed / total) * 100
  const variablePercent = (variable / total) * 100
  const installmentsPercent = (installments / total) * 100

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0'
    }}>
      <h3 style={{ margin: '0 0 25px 0', fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
        📊 Distribuição dos Gastos
      </h3>
      
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Gráfico de barras empilhadas */}
        <div style={{ 
          flex: '1 1 200px',
          minWidth: '200px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#2c3e50',
            marginBottom: '10px',
            textAlign: 'center'
          }}>
            {formatCurrency(total)}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#999',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            Total de Gastos
          </div>
          
          {/* Barra empilhada */}
          <div style={{
            width: '100%',
            height: '40px',
            backgroundColor: '#e9ecef',
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            position: 'relative'
          }}>
            {fixedPercent > 0 && (
              <div style={{
                width: `${fixedPercent}%`,
                height: '100%',
                backgroundColor: '#e67e22',
                transition: 'width 0.5s ease-out'
              }} />
            )}
            {variablePercent > 0 && (
              <div style={{
                width: `${variablePercent}%`,
                height: '100%',
                backgroundColor: '#3498db',
                transition: 'width 0.5s ease-out'
              }} />
            )}
            {installmentsPercent > 0 && (
              <div style={{
                width: `${installmentsPercent}%`,
                height: '100%',
                backgroundColor: '#9b59b6',
                transition: 'width 0.5s ease-out'
              }} />
            )}
          </div>
        </div>

        {/* Legenda */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {fixedPercent > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                backgroundColor: '#e67e22'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                    Gastos Fixos
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#e67e22' }}>
                    {formatCurrency(fixed)}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${fixedPercent}%`,
                    height: '100%',
                    backgroundColor: '#e67e22',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                  {fixedPercent.toFixed(1)}% do total
                </div>
              </div>
            </div>
          )}

          {variablePercent > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                backgroundColor: '#3498db'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                    Gastos Correntes
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#3498db' }}>
                    {formatCurrency(variable)}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${variablePercent}%`,
                    height: '100%',
                    backgroundColor: '#3498db',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                  {variablePercent.toFixed(1)}% do total
                </div>
              </div>
            </div>
          )}

          {installmentsPercent > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                backgroundColor: '#9b59b6'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                    Parcelamentos
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#9b59b6' }}>
                    {formatCurrency(installments)}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${installmentsPercent}%`,
                    height: '100%',
                    backgroundColor: '#9b59b6',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                  {installmentsPercent.toFixed(1)}% do total
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

