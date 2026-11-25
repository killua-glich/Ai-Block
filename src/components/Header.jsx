import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../data/AuthContext.jsx'

export default function Header() {
  const { user, status, logout } = useAuth()

  return (
    <header className="header">
      <Link to="/" className="logo">
        <span className="logo-mark" aria-hidden="true">◆</span>
        Ai-Block
      </Link>
      <nav className="nav">
        <NavLink to="/" end>Devices</NavLink>
        <NavLink to="/rentals">My rentals</NavLink>
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        {user && (
          <>
            <span className="nav-user">{user.name}</span>
            <button type="button" className="button-ghost" onClick={logout}>Log out</button>
          </>
        )}
        {!user && status === 'anonymous' && (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register">Sign up</NavLink>
          </>
        )}
      </nav>
    </header>
  )
}
