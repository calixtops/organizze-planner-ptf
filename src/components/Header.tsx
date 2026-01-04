import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Link } from 'react-router-dom'
import NavigationDrawer from './NavigationDrawer'

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <header style={{
        backgroundColor: 'var(--white)',
        borderBottom: '1px solid var(--gray-200)',
        padding: '1.5rem 3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Menu Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid var(--gray-300)',
              borderRadius: '8px',
              padding: '0.625rem',
              cursor: 'pointer',
              color: 'var(--gray-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--gray-100)'
              e.currentTarget.style.borderColor = 'var(--accent-orange)'
              e.currentTarget.style.color = 'var(--accent-orange)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = 'var(--gray-300)'
              e.currentTarget.style.color = 'var(--gray-700)'
            }}
          >
            <Menu size={22} />
          </button>

          <Link 
            to="/dashboard" 
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <h1 style={{
              color: 'var(--primary-dark)',
              fontSize: '1.75rem',
              fontWeight: '700',
              margin: 0,
              cursor: 'pointer',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--accent-orange)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--primary-dark)'
            }}
            >
              Organizze Planner
            </h1>
          </Link>
        </div>
      </header>

      {/* Navigation Drawer */}
      <NavigationDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />
    </>
  )
}
