import { useAuth } from '../contexts/AuthContext'
import { LogOut, User } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header style={{
      backgroundColor: 'var(--white)',
      borderBottom: '1px solid var(--gray-200)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h1 style={{
        color: 'var(--primary-dark)',
        fontSize: '1.5rem',
        fontWeight: '600',
        margin: 0
      }}>
        Organizze Planner
      </h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} color="var(--gray-600)" />
          <span style={{ color: 'var(--gray-700)', fontSize: '0.875rem' }}>
            {user?.username}
          </span>
        </div>
        
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--gray-300)',
            borderRadius: '0',
            cursor: 'pointer',
            color: 'var(--gray-600)',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--gray-100)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </header>
  )
}
