import { Outlet } from 'react-router-dom'
import Header from './Header'
import { ToastContainer } from './Toast'
import { useToast } from '../hooks/useToast'
import { useResponsive } from '../hooks/useResponsive'

export default function Layout() {
  const { toasts, removeToast } = useToast()
  const { isMobile } = useResponsive()

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: 'var(--gray-100)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main style={{ 
        flex: 1, 
        padding: isMobile ? '1rem' : '3rem',
        overflow: 'auto',
        width: '100%'
      }}>
        <Outlet />
      </main>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
