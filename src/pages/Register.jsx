import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../data/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await register({ email, name, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setIsSaving(false)
    }
  }

  return (
    <section className="auth-card">
      <h1>Create your account</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        <p className="auth-hint">At least 8 characters.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={isSaving}>Create account</button>
      </form>
      <p className="auth-hint">Already have an account? <Link to="/login">Log in</Link></p>
    </section>
  )
}
