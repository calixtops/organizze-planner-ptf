import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Accounts from './pages/Accounts'
import Layout from './components/Layout'
import MonthlyExpenses from './pages/MonthlyExpenses'
import ExpensesHistory from './pages/ExpensesHistory'
import Investments from './pages/Investments'
import Goals from './pages/Goals'
import SummaryReport from './pages/SummaryReport'

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
        <Route path="monthly-expenses" element={<MonthlyExpenses />} />
        <Route path="expenses-history" element={<ExpensesHistory />} />
        <Route path="investments" element={<Investments />} />
        <Route path="goals" element={<Goals />} />
        <Route path="summary-report" element={<SummaryReport />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="accounts" element={<Accounts />} />
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
