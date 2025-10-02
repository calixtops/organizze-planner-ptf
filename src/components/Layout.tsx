import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { ToastContainer } from './Toast'
import { useToast } from '../hooks/useToast'
import { useResponsive } from '../hooks/useResponsive'
import { Menu, X } from 'lucide-react'

export default function Layout() {
  const { toasts, removeToast } = useToast()
  const { isMobile } = useResponsive()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      backgroundColor: 'var(--gray-100)'
    }}>
      {/* Sidebar */}
      {isMobile ? (
        <>
          {/* Mobile Sidebar */}
          <div className={`sidebar-mobile ${sidebarOpen ? 'open' : ''}`}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 2rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{
                color: 'var(--white)',
                fontSize: '1.25rem',
                fontWeight: '700',
                margin: 0
              }}>
                Organizze
              </h2>
              <button
                onClick={closeSidebar}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--white)',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <Sidebar onItemClick={closeSidebar} />
          </div>
          
          {/* Mobile Overlay */}
          <div 
            className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
            onClick={closeSidebar}
          />
        </>
      ) : (
        <Sidebar />
      )}

      {/* Main Content */}
      <div className="main-content" style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: isMobile ? 0 : 0
      }}>
        {/* Header */}
        {isMobile ? (
          <div className="header-mobile">
            <button
              onClick={toggleSidebar}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '4px',
                color: 'var(--gray-600)'
              }}
            >
              <Menu size={24} />
            </button>
            <h1 style={{
              color: 'var(--primary-dark)',
              fontSize: '1.25rem',
              fontWeight: '700',
              margin: 0
            }}>
              Organizze Planner
            </h1>
            <div style={{ width: '40px' }} /> {/* Spacer */}
          </div>
        ) : (
          <Header />
        )}
        
        <main style={{ 
          flex: 1, 
          padding: isMobile ? '1rem' : '2rem',
          overflow: 'auto'
        }}>
          <Outlet />
        </main>
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
