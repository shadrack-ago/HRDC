import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    console.log('[RouteGuard] Loading auth state, showing spinner. Path:', location.pathname)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    console.warn('[RouteGuard] No user, redirecting to /login from', location.pathname)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  console.log('[RouteGuard] User authenticated, rendering child route for', location.pathname, 'user:', user?.id)
  return children
}

export default ProtectedRoute
