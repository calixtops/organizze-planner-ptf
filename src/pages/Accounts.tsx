import { useState, useEffect } from 'react'
import api from '../services/api'
import { Account, CreditCard } from '../types'
import AccountForm from '../components/accounts/AccountForm'
import CreditCardForm from '../components/accounts/CreditCardForm'
import AccountList from '../components/accounts/AccountList'
import CreditCardList from '../components/accounts/CreditCardList'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showAccountForm, setShowAccountForm] = useState(false)
  const [showCreditCardForm, setShowCreditCardForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [editingCreditCard, setEditingCreditCard] = useState<CreditCard | null>(null)
  const [activeTab, setActiveTab] = useState<'accounts' | 'credit-cards'>('accounts')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [accountsRes, creditCardsRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/credit-cards')
      ])
      
      setAccounts(accountsRes.data.accounts)
      setCreditCards(creditCardsRes.data.creditCards)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccountCreated = (account: Account) => {
    setAccounts(prev => [account, ...prev])
    setShowAccountForm(false)
  }

  const handleAccountUpdated = (updatedAccount: Account) => {
    setAccounts(prev => 
      prev.map(a => a._id === updatedAccount._id ? updatedAccount : a)
    )
    setEditingAccount(null)
  }

  const handleAccountDeleted = (accountId: string) => {
    setAccounts(prev => prev.filter(a => a._id !== accountId))
  }

  const handleCreditCardCreated = (creditCard: CreditCard) => {
    setCreditCards(prev => [creditCard, ...prev])
    setShowCreditCardForm(false)
  }

  const handleCreditCardUpdated = (updatedCreditCard: CreditCard) => {
    setCreditCards(prev => 
      prev.map(c => c._id === updatedCreditCard._id ? updatedCreditCard : c)
    )
    setEditingCreditCard(null)
  }

  const handleCreditCardDeleted = (creditCardId: string) => {
    setCreditCards(prev => prev.filter(c => c._id !== creditCardId))
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    setShowAccountForm(true)
  }

  const handleEditCreditCard = (creditCard: CreditCard) => {
    setEditingCreditCard(creditCard)
    setShowCreditCardForm(true)
  }

  const handleCloseForms = () => {
    setShowAccountForm(false)
    setShowCreditCardForm(false)
    setEditingAccount(null)
    setEditingCreditCard(null)
  }

  if (loading) {
    return <LoadingSpinner message="Carregando contas e cartões..." />
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          color: 'var(--primary-dark)',
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          margin: 0
        }}>
          Contas e Cartões
        </h1>
        <p style={{
          color: 'var(--gray-600)',
          fontSize: '1rem',
          margin: 0
        }}>
          Gerencie suas contas bancárias e cartões de crédito
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--gray-200)',
        marginBottom: '2rem'
      }}>
        <button
          onClick={() => setActiveTab('accounts')}
          style={{
            padding: '1rem 2rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'accounts' ? '2px solid var(--accent-orange)' : '2px solid transparent',
            color: activeTab === 'accounts' ? 'var(--accent-orange)' : 'var(--gray-600)',
            fontWeight: activeTab === 'accounts' ? '500' : '400',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Contas Bancárias ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('credit-cards')}
          style={{
            padding: '1rem 2rem',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'credit-cards' ? '2px solid var(--accent-orange)' : '2px solid transparent',
            color: activeTab === 'credit-cards' ? 'var(--accent-orange)' : 'var(--gray-600)',
            fontWeight: activeTab === 'credit-cards' ? '500' : '400',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Cartões de Crédito ({creditCards.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'accounts' ? (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              color: 'var(--primary-dark)',
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: 0
            }}>
              Contas Bancárias
            </h2>
            <button
              onClick={() => setShowAccountForm(true)}
              className="btn btn-primary"
            >
              Nova Conta
            </button>
          </div>
          <AccountList
            accounts={accounts}
            onEdit={handleEditAccount}
            onDelete={handleAccountDeleted}
          />
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              color: 'var(--primary-dark)',
              fontSize: '1.5rem',
              fontWeight: '600',
              margin: 0
            }}>
              Cartões de Crédito
            </h2>
            <button
              onClick={() => setShowCreditCardForm(true)}
              className="btn btn-primary"
            >
              Novo Cartão
            </button>
          </div>
          <CreditCardList
            creditCards={creditCards}
            onEdit={handleEditCreditCard}
            onDelete={handleCreditCardDeleted}
          />
        </div>
      )}

      {/* Modals */}
      {showAccountForm && (
        <AccountForm
          account={editingAccount}
          onSuccess={editingAccount ? handleAccountUpdated : handleAccountCreated}
          onClose={handleCloseForms}
        />
      )}

      {showCreditCardForm && (
        <CreditCardForm
          creditCard={editingCreditCard}
          onSuccess={editingCreditCard ? handleCreditCardUpdated : handleCreditCardCreated}
          onClose={handleCloseForms}
        />
      )}
    </div>
  )
}
