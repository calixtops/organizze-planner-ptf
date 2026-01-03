import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import FixedExpenses from './pages/FixedExpenses'
import VariableExpenses from './pages/VariableExpenses'
import Installments from './pages/Installments'
import Admin from './pages/Admin'
import Layout from './components/Layout'

function AppRoutes() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/dashboard" /> : <Register />}
      />
      <Route 
        path="/" 
        element={user ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="fixed-expenses" element={<FixedExpenses />} />
        <Route path="installments" element={<Installments />} />
        <Route path="variable-expenses" element={<VariableExpenses />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App
