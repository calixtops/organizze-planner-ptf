import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, BarChart3, DollarSign, CreditCard, ShoppingCart, Settings, User, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface NavigationDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/fixed-expenses', label: 'Gastos Fixos', icon: DollarSign },
  { path: '/installments', label: 'Parcelamentos', icon: CreditCard },
  { path: '/variable-expenses', label: 'Gastos Correntes', icon: ShoppingCart },
]

export default function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  // Fechar drawer ao pressionar ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevenir scroll do body quando drawer está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleNavigation = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            transition: 'opacity 0.3s ease',
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none'
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '320px',
          backgroundColor: 'var(--white)',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header do Drawer */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: '700',
            color: 'var(--primary-dark)'
          }}>
            Navegação
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '6px',
              color: 'var(--gray-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-100)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <nav style={{
          flex: 1,
          padding: '1rem 0',
          overflowY: 'auto'
        }}>
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => handleNavigation(path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.5rem',
                  backgroundColor: isActive ? 'var(--accent-orange)' : 'transparent',
                  color: isActive ? 'white' : 'var(--gray-700)',
                  border: 'none',
                  borderLeft: isActive ? '4px solid var(--accent-orange)' : '4px solid transparent',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--gray-100)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Icon size={20} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Footer Section - User Actions */}
        <div style={{
          borderTop: '1px solid var(--gray-200)',
          padding: '1rem 0'
        }}>
          {/* User Info */}
          <div style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--gray-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} color="var(--gray-600)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-800)'
              }}>
                {user?.username}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--gray-500)'
              }}>
                Usuário
              </div>
            </div>
          </div>

          {/* Admin Button */}
          <button
            onClick={() => {
              navigate('/admin')
              onClose()
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.875rem 1.5rem',
              backgroundColor: location.pathname === '/admin' ? 'var(--accent-orange)' : 'transparent',
              color: location.pathname === '/admin' ? 'white' : 'var(--gray-700)',
              border: 'none',
              borderLeft: location.pathname === '/admin' ? '4px solid var(--accent-orange)' : '4px solid transparent',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: location.pathname === '/admin' ? '600' : '500',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== '/admin') {
                e.currentTarget.style.backgroundColor = 'var(--gray-100)'
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== '/admin') {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <Settings size={18} />
            Painel Admin
          </button>

          {/* Logout Button */}
          <button
            onClick={() => {
              logout()
              onClose()
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.875rem 1.5rem',
              backgroundColor: 'transparent',
              color: 'var(--error)',
              border: 'none',
              borderLeft: '4px solid transparent',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              textAlign: 'left',
              marginTop: '0.25rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </>
  )
}

