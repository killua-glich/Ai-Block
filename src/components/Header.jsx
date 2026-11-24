import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        <span className="logo-mark" aria-hidden="true">◆</span>
        Ai-Block
      </Link>
      <nav className="nav">
        <NavLink to="/" end>Devices</NavLink>
        <NavLink to="/rentals">My rentals</NavLink>
      </nav>
    </header>
  )
}
