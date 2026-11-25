import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../data/AuthContext.jsx'

// Sends a visitor who is known to be logged out to the login page, and brings them back afterwards.
// While the server has not answered, or cannot be reached, the page is shown: the server checks every request anyway.
export default function RequireLogin({ children }) {
  const { status } = useAuth()
  const location = useLocation()
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
