import React from 'react'
import { Installment } from '../../types'
import { formatCurrency } from '../../utils/format'

interface InstallmentsStatusProps {
  installments: Installment[]
}

export default function InstallmentsStatus({ installments }: InstallmentsStatusProps) {
  const activeInstallments = installments.filter(i => i.status === 'active')
  
  if (activeInstallments.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid #f0f0f0',
        textAlign: 'center',
        color: '#999'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>Nenhum parcelamento ativo</div>
      </div>
    )
  }

  const totalMonthly = activeInstallments.reduce((sum, inst) => {
    const monthlyAmount = inst.totalAmount / inst.installments
    return sum + monthlyAmount
  }, 0)

  const totalRemaining = activeInstallments.reduce((sum, inst) => {
    const monthlyAmount = inst.totalAmount / inst.installments
    const remaining = inst.installments - inst.currentPaid
    return sum + (monthlyAmount * remaining)
  }, 0)

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0'
    }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
        💳 Parcelamentos Ativos
      </h3>

      {/* Resumo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px',
        marginBottom: '25px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '12px'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
            Valor Mensal
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
            {formatCurrency(totalMonthly)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
            Restante a Pagar
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
            {formatCurrency(totalRemaining)}
          </div>
        </div>
      </div>

      {/* Lista de parcelamentos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeInstallments.slice(0, 5).map(inst => {
          const monthlyAmount = inst.totalAmount / inst.installments
          const progress = (inst.currentPaid / inst.installments) * 100
          const remaining = inst.installments - inst.currentPaid

          return (
            <div
              key={inst._id}
              style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                border: '1px solid #e9ecef'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50', marginBottom: '4px' }}>
                    {inst.description}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {inst.currentPaid}/{inst.installments} parcelas pagas • {remaining} restantes
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#9b59b6' }}>
                    {formatCurrency(monthlyAmount)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    /mês
                  </div>
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#9b59b6',
                  transition: 'width 0.3s',
                  borderRadius: '4px'
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {activeInstallments.length > 5 && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          +{activeInstallments.length - 5} parcelamento(s) adicional(is)
        </div>
      )}
    </div>
  )
}

