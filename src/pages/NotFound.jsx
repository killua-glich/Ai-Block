import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="not-found">
      <p className="not-found-code" aria-hidden="true">404</p>
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist or has moved.</p>
      <Link to="/">Back to devices</Link>
    </section>
  )
}
