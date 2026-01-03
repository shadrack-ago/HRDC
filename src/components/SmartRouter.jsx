import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const SmartRouter = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (user && location.pathname === '/dashboard') {
      // If user just logged in and landed on dashboard, check if they should go to admin
      if (user.isAdmin) {
        navigate('/admin', { replace: true })
      }
      // Regular users stay on dashboard
    }
  }, [user, location.pathname, navigate])

  return null // This component doesn't render anything
}

export default SmartRouter
