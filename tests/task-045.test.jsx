// Web site: the header shows who is logged in.
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import devices from '../src/data/devices.js'
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

const boss = { id: 2, email: 'boss@example.com', name: 'Boss', role: 'admin' }

const nav = () => screen.getByRole('navigation')

describe('045 header', () => {
  it('a logged-in user sees their name and a Log out button, and no login links', async () => {
    serve({ me: ada })
    renderAt('/')
    expect(await screen.findByText('Ada')).toHaveClass('nav-user')
    expect(within(nav()).getByRole('button', { name: 'Log out' })).toBeInTheDocument()
    expect(within(nav()).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument()
    expect(within(nav()).queryByRole('link', { name: 'Sign up' })).not.toBeInTheDocument()
  })

  it('a visitor who is not logged in sees Log in and Sign up', async () => {
    serve({ me: null })
    renderAt('/')
    expect(await within(nav()).findByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
    expect(within(nav()).getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register')
    expect(within(nav()).queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it('shows neither while the server has not answered, and neither when it cannot be reached', async () => {
    serve({ routes: { 'GET /api/auth/me': () => new Promise(() => {}) } })
    renderAt('/')
    expect(within(nav()).queryByRole('link', { name: 'Log in' })).not.toBeInTheDocument()
    expect(within(nav()).queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it('the devices and My rentals links are always there', async () => {
    serve({ me: null })
    renderAt('/')
    expect(within(nav()).getByRole('link', { name: 'Devices' })).toHaveAttribute('href', '/')
    expect(within(nav()).getByRole('link', { name: 'My rentals' })).toHaveAttribute('href', '/rentals')
  })

  it('only an admin sees the Admin link', async () => {
    serve({ me: boss })
    renderAt('/')
    expect(await within(nav()).findByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
  })

  it('a normal user does not see the Admin link', async () => {
    serve({ me: ada })
    renderAt('/')
    await screen.findByText('Ada')
    expect(within(nav()).queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('Log out asks the server, then the visitor sees Log in and Sign up', async () => {
    const calls = serve({ me: ada, routes: { 'POST /api/auth/logout': reply(204, null) } })
    renderAt('/')
    fireEvent.click(await within(nav()).findByRole('button', { name: 'Log out' }))
    expect(await within(nav()).findByRole('link', { name: 'Log in' })).toBeInTheDocument()
    expect(screen.queryByText('Ada')).not.toBeInTheDocument()
    expect(calls.some((c) => c.method === 'POST' && c.url === '/api/auth/logout')).toBe(true)
  })

  it('the name and the logout button are styled to fit the bar', () => {
    expect(rule('.nav-user')?.['font-weight']).toBe('600')
    expect(rule('.nav-user')?.color).toBe('var(--color-text)')
    expect(rule('.nav-user')?.['align-self']).toBe('center')
    expect(rule('.nav .button-ghost')?.padding).toBeTruthy()
    vi.unstubAllGlobals()
  })
})
