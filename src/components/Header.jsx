import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">Ai-Block</Link>
      <nav style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/">Devices</Link>
        <Link to="/rentals">My rentals</Link>
      </nav>
    </header>
  )
}
