// Web site: the login page and the register page.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import devices from '../src/data/devices.js'
import App from '../src/App.jsx'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

const reply = (status, body) => ({ ok: status < 400, status, json: async () => body })
const ada = { id: 1, email: 'ada@example.com', name: 'Ada', role: 'user' }

// A fake server. `me` is the user the cookie belongs to (null: nobody). `routes` answer other addresses.
function serve({ me = null, routes = {} } = {}) {
  const calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const method = options.method ?? 'GET'
      calls.push({ url, method, body: options.body ? JSON.parse(options.body) : undefined })
      const handler = routes[`${method} ${url}`]
      if (handler) return typeof handler === 'function' ? handler(options) : handler
      if (url === '/api/auth/me') return me ? reply(200, { user: me }) : reply(401, { error: 'Not logged in.' })
      if (url === '/api/devices') return reply(200, devices)
      if (url === '/api/rentals') return reply(200, [])
      return reply(404, { error: 'Not found' })
    }),
  )
  return calls
}

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const hero = () => screen.findByRole('heading', { level: 1, name: /Tech you need/ })

describe('044 login page', () => {
  it('has a heading, an email and a password field, a button and a link to the register page', async () => {
    serve({ me: null })
    renderAt('/login')
    expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', '/register')
  })

  it('logging in sends the email and password, then goes to the catalog', async () => {
    const calls = serve({ me: null, routes: { 'POST /api/auth/login': reply(200, { user: ada }) } })
    renderAt('/login')
    type('Email', 'ada@example.com')
    type('Password', 'correct horse battery')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await hero()).toBeInTheDocument()
    expect(calls.find((c) => c.url === '/api/auth/login').body).toEqual({ email: 'ada@example.com', password: 'correct horse battery' })
  })

  it('goes back to the page you came from', async () => {
    serve({ me: null, routes: { 'POST /api/auth/login': reply(200, { user: ada }) } })
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/rentals' } }]}>
        <App />
      </MemoryRouter>,
    )
    type('Email', 'ada@example.com')
    type('Password', 'correct horse battery')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'My rentals' })).toBeInTheDocument()
  })

  it('shows the message of the server when the login is refused, and lets you try again', async () => {
    serve({ me: null, routes: { 'POST /api/auth/login': reply(401, { error: 'Wrong email or password.' }) } })
    renderAt('/login')
    type('Email', 'ada@example.com')
    type('Password', 'wrong password')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.')
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
    expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument()
  })

  it('the button is switched off while the login is on its way', () => {
    serve({ me: null, routes: { 'POST /api/auth/login': () => new Promise(() => {}) } })
    renderAt('/login')
    type('Email', 'ada@example.com')
    type('Password', 'correct horse battery')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled()
  })
})

describe('044 register page', () => {
  it('has a name, an email and a password field, a hint, a button and a link to the login page', () => {
    serve({ me: null })
    renderAt('/register')
    expect(screen.getByRole('heading', { level: 1, name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'text')
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('minlength', '8')
    expect(screen.getByText('At least 8 characters.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
  })

  it('registering sends the three fields and goes to the catalog', async () => {
    const calls = serve({ me: null, routes: { 'POST /api/auth/register': reply(201, { user: ada }) } })
    renderAt('/register')
    type('Name', 'Ada Lovelace')
    type('Email', 'ada@example.com')
    type('Password', 'correct horse battery')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await hero()).toBeInTheDocument()
    expect(calls.find((c) => c.url === '/api/auth/register').body).toEqual({
      email: 'ada@example.com',
      name: 'Ada Lovelace',
      password: 'correct horse battery',
    })
  })

  it('shows the message of the server, for example for an email that is taken', async () => {
    serve({ me: null, routes: { 'POST /api/auth/register': reply(409, { error: 'That email is already registered.' }) } })
    renderAt('/register')
    type('Name', 'Ada')
    type('Email', 'ada@example.com')
    type('Password', 'correct horse battery')
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('That email is already registered.')
  })
})

describe('044 the cards look like cards', () => {
  it('.auth-card is a narrow, centred, raised card', () => {
    const card = rule('.auth-card')
    expect(card?.['max-width']).toBe('26rem')
    expect(card?.margin).toBe('3rem auto')
    expect(card?.padding).toBe('2rem')
    expect(card?.background).toBe('var(--color-surface)')
    expect(card?.border).toBe('1px solid var(--color-border)')
    expect(card?.['border-radius']).toBe('var(--radius)')
    expect(card?.['box-shadow']).toBe('var(--shadow)')
  })

  it('the form is a column, the labels are small caps above their field', () => {
    expect(rule('.auth-card form')?.display).toBe('flex')
    expect(rule('.auth-card form')?.['flex-direction']).toBe('column')
    expect(rule('.auth-card label')?.display).toBe('flex')
    expect(rule('.auth-card label')?.['flex-direction']).toBe('column')
    expect(rule('.auth-card label')?.['text-transform']).toBe('uppercase')
  })

  it('the fields fill the card, have a border and a visible focus ring', () => {
    const input = rule('.auth-card input')
    expect(input?.width).toBe('100%')
    expect(input?.border).toBe('1px solid var(--color-border)')
    expect(input?.['border-radius']).toBe('var(--radius-sm)')
    expect(input?.color).toBe('var(--color-text)')
    expect(rule('.auth-card input:focus-visible')?.outline).toContain('var(--color-primary)')
  })

  it('the button fills the card and the hints are muted', () => {
    expect(rule('.auth-card button')?.width).toBe('100%')
    expect(rule('.auth-hint')?.color).toBe('var(--color-muted)')
  })

  it('the catalog still lists all devices (nothing else changed)', async () => {
    serve({ me: null })
    renderAt('/')
    expect(await screen.findAllByRole('heading', { level: 3 })).toHaveLength(devices.length)
    vi.unstubAllGlobals()
  })
})
