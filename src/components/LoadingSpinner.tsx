interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
}

export default function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px'
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '1rem'
    }}>
      <div 
        className="loading"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          borderWidth: size === 'small' ? '2px' : '3px'
        }}
      />
      {message && (
        <p style={{
          color: 'var(--gray-600)',
          fontSize: '0.875rem',
          margin: 0
        }}>
          {message}
        </p>
      )}
    </div>
  )
}
