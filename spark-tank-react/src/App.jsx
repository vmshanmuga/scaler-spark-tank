import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import GroupView from './pages/GroupView'
import Admin from './pages/Admin'
import LiveDashboard from './pages/LiveDashboard'
import Settings from './pages/Settings'
import DropshippingLoader from './components/DropshippingLoader'
import './App.css'

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, userAccess, loading, isAdmin } = useAuth()

  // Don't show loader on page refresh - let the page render immediately
  // The AuthContext handles auth in the background
  if (!user && !loading) {
    return <Navigate to="/" replace />
  }

  if (user && adminOnly && !isAdmin()) {
    return <Navigate to="/home" replace />
  }

  // Render children immediately if user exists, or if still loading (to prevent flicker)
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/live-dashboard" element={<LiveDashboard />} />

          {/* Protected Routes */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groupview"
            element={
              <ProtectedRoute>
                <GroupView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Admin Only Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
