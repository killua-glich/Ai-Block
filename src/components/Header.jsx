import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">Ai-Block</Link>
      <nav>
        <Link to="/">Devices</Link>
      </nav>
    </header>
  )
}
