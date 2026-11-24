import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <p>© 2026 Ai-Block · Rent devices by the day</p>
      <div className="footer-links">
        <Link to="/">Catalog</Link>
        <Link to="/rentals">Bookings</Link>
      </div>
    </footer>
  )
}
