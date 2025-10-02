import React, { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    color: 'var(--success)',
    bgColor: '#dcfce715',
    borderColor: '#dcfce730'
  },
  error: {
    icon: XCircle,
    color: 'var(--error)',
    bgColor: '#fef2f215',
    borderColor: '#fef2f230'
  },
  warning: {
    icon: AlertCircle,
    color: 'var(--warning)',
    bgColor: '#fef3c715',
    borderColor: '#fef3c730'
  },
  info: {
    icon: Info,
    color: 'var(--info)',
    bgColor: '#dbeafe15',
    borderColor: '#dbeafe30'
  }
}

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const config = toastConfig[type]
  const Icon = config.icon

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--white)',
        border: `1px solid ${config.borderColor}`,
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
        padding: '1rem',
        marginBottom: '0.75rem',
        minWidth: '320px',
        maxWidth: '400px',
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      className={isLeaving ? 'toast-leaving' : ''}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '3px',
            backgroundColor: config.color,
            width: '100%',
            transformOrigin: 'left',
            animation: `toast-progress ${duration}ms linear forwards`
          }}
        />
      )}

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        {/* Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          backgroundColor: config.bgColor,
          color: config.color,
          flexShrink: 0
        }}>
          <Icon size={16} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            margin: '0 0 0.25rem 0',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--gray-900)',
            lineHeight: 1.2
          }}>
            {title}
          </h4>
          {message && (
            <p style={{
              margin: 0,
              fontSize: '0.8125rem',
              color: 'var(--gray-600)',
              lineHeight: 1.4
            }}>
              {message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem',
            borderRadius: '4px',
            color: 'var(--gray-400)',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--gray-100)'
            e.currentTarget.style.color = 'var(--gray-600)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--gray-400)'
          }}
        >
          <X size={16} />
        </button>
      </div>

    </div>
  )
}

// Toast Container
interface ToastContainerProps {
  toasts: Array<{
    id: string
    type: ToastType
    title: string
    message?: string
    duration?: number
  }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{ pointerEvents: 'auto' }}
        >
          <Toast
            {...toast}
            onClose={onRemove}
          />
        </div>
      ))}
    </div>
  )
}
