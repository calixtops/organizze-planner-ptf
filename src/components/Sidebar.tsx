import { NavLink } from 'react-router-dom'
import { 
  BarChart3, 
  DollarSign,
  CreditCard,
  ShoppingCart,
  Settings
} from 'lucide-react'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/fixed-expenses', label: 'Gastos Fixos', icon: DollarSign },
  { path: '/installments', label: 'Parcelamentos', icon: CreditCard },
  { path: '/variable-expenses', label: 'Gastos Correntes', icon: ShoppingCart },
  { path: '/admin', label: 'Painel Admin', icon: Settings },
]

interface SidebarProps {
  onItemClick?: () => void
}

export default function Sidebar({ onItemClick }: SidebarProps = {}) {
  return (
    <aside style={{
      width: '250px',
      backgroundColor: 'var(--primary-dark)',
      padding: '2rem 0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <nav style={{ flex: 1 }}>
        {menuItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onItemClick}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 2rem',
              color: isActive ? 'var(--accent-orange)' : 'var(--white)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? '500' : '400',
              backgroundColor: isActive ? 'rgba(242, 89, 36, 0.1)' : 'transparent',
              borderRight: isActive ? '3px solid var(--accent-orange)' : '3px solid transparent',
              transition: 'all 0.2s ease'
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
      
      <div style={{
        padding: '1rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: 'auto'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.6)',
          textAlign: 'center'
        }}>
          Organizze Planner v2.0
        </div>
      </div>
    </aside>
  )
}
