import { useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { parseC6BankText, convertC6ToTransactions, createSampleTransactions } from '../../utils/importTransactions'
import api from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

interface TransactionImporterProps {
  onImportComplete?: (count: number) => void
  onClose?: () => void
}

export default function TransactionImporter({ onImportComplete, onClose }: TransactionImporterProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [textData, setTextData] = useState('')
  const [parsedTransactions, setParsedTransactions] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const [useSampleData, setUseSampleData] = useState(false)
  const { user } = useAuth()

  const handleTextUpload = () => {
    try {
      setError('')
      
      let transactions
      if (useSampleData) {
        transactions = createSampleTransactions()
      } else {
        const rawData = parseC6BankText(textData)
        transactions = convertC6ToTransactions(rawData)
      }
      
      if (transactions.length === 0) {
        setError('Nenhuma transação válida encontrada no texto. Verifique o formato.')
        return
      }
      
      setParsedTransactions(transactions)
      setStep('preview')
    } catch (err: any) {
      console.error('Erro ao processar dados:', err)
      setError('Erro ao processar o texto. Verifique o formato dos dados.')
    }
  }

  const handleImport = async () => {
    if (!user) return
    
    setImporting(true)
    setStep('importing')
    setError('')
    
    try {
      let successCount = 0
      
      // Enviar transações para o backend
      for (const transaction of parsedTransactions) {
        try {
          const response = await api.post('/transactions', {
            ...transaction,
            userId: user._id
          })
          
          if (response.data) {
            successCount++
          }
        } catch (err) {
          console.warn('Erro ao importar transação:', transaction.description, err)
          // Se o backend falhar, salvar no localStorage como fallback
          try {
            const existingTransactions = JSON.parse(localStorage.getItem('importedTransactions') || '[]')
            const newTransaction = {
              ...transaction,
              _id: `imported_${Date.now()}_${Math.random()}`,
              userId: user._id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            
            existingTransactions.push(newTransaction)
            localStorage.setItem('importedTransactions', JSON.stringify(existingTransactions))
            successCount++
          } catch (fallbackErr) {
            console.error('Erro no fallback:', fallbackErr)
          }
        }
      }
      
      setImportedCount(successCount)
      setStep('complete')
      
      if (onImportComplete) {
        onImportComplete(successCount)
      }
      
    } catch (err: any) {
      console.error('Erro na importação:', err)
      setError('Erro ao importar transações. Tente novamente.')
      setStep('preview')
    } finally {
      setImporting(false)
    }
  }

  const resetImporter = () => {
    setStep('upload')
    setTextData('')
    setParsedTransactions([])
    setError('')
    setImportedCount(0)
    setUseSampleData(false)
  }

  if (step === 'complete') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{
          backgroundColor: 'var(--white)',
          borderRadius: '8px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'var(--success)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <CheckCircle size={32} color="white" />
          </div>
          
          <h3 style={{
            color: 'var(--primary-dark)',
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: '0 0 1rem 0'
          }}>
            Importação Concluída!
          </h3>
          
          <p style={{
            color: 'var(--gray-600)',
            fontSize: '1rem',
            margin: '0 0 2rem 0',
            lineHeight: '1.5'
          }}>
            <strong>{importedCount}</strong> transações foram importadas com sucesso!
            <br />
            Agora você pode ver seus dados no dashboard.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={resetImporter}
              className="btn btn-secondary"
            >
              Importar Mais
            </button>
            <button
              onClick={onClose}
              className="btn btn-primary"
            >
              Ver Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--white)',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Upload size={20} color="white" />
            </div>
            <div>
              <h2 style={{
                margin: 0,
                color: 'var(--primary-dark)',
                fontSize: '1.25rem',
                fontWeight: '700'
              }}>
                Importar Transações
              </h2>
              <p style={{
                margin: 0,
                color: 'var(--gray-500)',
                fontSize: '0.875rem'
              }}>
                C6 Bank → Organizze Planner
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '4px',
                color: 'var(--gray-500)'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {step === 'upload' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <input
                  type="checkbox"
                  id="useSample"
                  checked={useSampleData}
                  onChange={(e) => setUseSampleData(e.target.checked)}
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="useSample" style={{
                  color: 'var(--gray-700)',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}>
                  Usar dados de exemplo (recomendado para teste)
                </label>
              </div>

              {!useSampleData && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: 'var(--gray-700)',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    Cole aqui o texto do histórico (C6 Bank ou Google Pay):
                  </label>
                  <textarea
                    value={textData}
                    onChange={(e) => setTextData(e.target.value)}
                    placeholder="Cole aqui o texto completo do histórico (C6 Bank ou Google Pay)..."
                    style={{
                      width: '100%',
                      height: '200px',
                      padding: '1rem',
                      border: '2px solid var(--gray-200)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontFamily: 'monospace',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-orange)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--gray-200)'
                    }}
                  />
                </div>
              )}

              {error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertCircle size={16} color="var(--error)" />
                  <span style={{ color: 'var(--error)', fontSize: '0.875rem' }}>
                    {error}
                  </span>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={handleTextUpload}
                  disabled={!useSampleData && !textData.trim()}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FileText size={16} />
                  Processar Dados
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <Sparkles size={20} color="var(--accent-orange)" />
                <h3 style={{
                  margin: 0,
                  color: 'var(--primary-dark)',
                  fontSize: '1.125rem',
                  fontWeight: '600'
                }}>
                  Prévia das Transações ({parsedTransactions.length})
                </h3>
              </div>

              <div style={{
                maxHeight: '400px',
                overflow: 'auto',
                border: '1px solid var(--gray-200)',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem'
                }}>
                  <thead style={{
                    backgroundColor: 'var(--gray-50)',
                    position: 'sticky',
                    top: 0
                  }}>
                    <tr>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>
                        Descrição
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>
                        Valor
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>
                        Categoria
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        borderBottom: '1px solid var(--gray-200)',
                        fontWeight: '600',
                        color: 'var(--gray-700)'
                      }}>
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTransactions.slice(0, 20).map((transaction, index) => (
                      <tr key={index} style={{
                        borderBottom: '1px solid var(--gray-100)'
                      }}>
                        <td style={{
                          padding: '0.75rem',
                          color: 'var(--gray-700)',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {transaction.description}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          color: 'var(--error)',
                          fontWeight: '600'
                        }}>
                          R$ {transaction.amount.toFixed(2)}
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          color: 'var(--gray-700)'
                        }}>
                          <span style={{
                            backgroundColor: 'var(--gray-100)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}>
                            {transaction.category}
                          </span>
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          color: 'var(--gray-600)',
                          fontSize: '0.8125rem'
                        }}>
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {parsedTransactions.length > 20 && (
                  <div style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: 'var(--gray-500)',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--gray-50)'
                  }}>
                    ... e mais {parsedTransactions.length - 20} transações
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'space-between'
              }}>
                <button
                  onClick={() => setStep('upload')}
                  className="btn btn-secondary"
                >
                  Voltar
                </button>
                <button
                  onClick={handleImport}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Upload size={16} />
                  Importar {parsedTransactions.length} Transações
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div style={{
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1.5rem auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent-orange)' }} />
              </div>
              
              <h3 style={{
                margin: '0 0 1rem 0',
                color: 'var(--primary-dark)',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                Importando Transações...
              </h3>
              
              <p style={{
                margin: 0,
                color: 'var(--gray-600)',
                fontSize: '0.875rem'
              }}>
                Por favor, aguarde enquanto processamos seus dados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
