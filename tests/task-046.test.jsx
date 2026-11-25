// Web site: My rentals needs a login, and so does renting.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import devices from '../src/data/devices.js'
import App from '../src/App.jsx'
import { renderAt } from './helpers.jsx'

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

afterEach(() => vi.unstubAllGlobals())
const heading = (name) => screen.findByRole('heading', { level: 1, name })

describe('046 login is needed', () => {
  it('a visitor who is not logged in is sent from My rentals to the login page', async () => {
    serve({ me: null })
    renderAt('/rentals')
    expect(await heading('Log in')).toBeInTheDocument()
    expect(screen.queryByText(/Loading your rentals/)).not.toBeInTheDocument()
  })

  it('after logging in the visitor lands on My rentals again', async () => {
    serve({ me: null, routes: { 'POST /api/auth/login': reply(200, { user: ada }) } })
    renderAt('/rentals')
    await heading('Log in')
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct horse battery' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await heading('My rentals')).toBeInTheDocument()
  })

  it('a logged-in user sees My rentals', async () => {
    serve({ me: ada })
    renderAt('/rentals')
    expect(await heading('My rentals')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1, name: 'Log in' })).not.toBeInTheDocument()
  })

  it('while the server has not answered, and when it cannot be reached, the page is shown', async () => {
    serve({ routes: { 'GET /api/auth/me': () => new Promise(() => {}) } })
    const first = renderAt('/rentals')
    expect(screen.getByRole('heading', { level: 1, name: 'My rentals' })).toBeInTheDocument()
    first.unmount()

    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    renderAt('/rentals')
    expect(await heading('My rentals')).toBeInTheDocument()
  })

  it('the catalog and the detail page stay open to everybody', async () => {
    serve({ me: null })
    renderAt('/devices/3')
    expect(await heading('Sony Alpha 7 IV')).toBeInTheDocument()
  })
})

describe('046 renting needs a login', () => {
  const dates = () => {
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2099-12-01' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2099-12-02' } })
  }

  it('a visitor who is not logged in gets a link to log in instead of the Rent button', async () => {
    serve({ me: null })
    renderAt('/devices/3')
    const link = await screen.findByRole('link', { name: 'Log in', description: '' }).catch(() => null)
    expect(link ?? screen.getAllByRole('link', { name: 'Log in' })[0]).toHaveAttribute('href', '/login')
    expect(screen.queryByRole('button', { name: /^rent$/i })).not.toBeInTheDocument()
    expect(screen.getByText(/to rent this device/)).toBeInTheDocument()
  })

  it('after the login the visitor is back on the device', async () => {
    serve({ me: null, routes: { 'POST /api/auth/login': reply(200, { user: ada }) } })
    render(
      <MemoryRouter initialEntries={['/devices/3']}>
        <App />
      </MemoryRouter>,
    )
    const links = await screen.findAllByRole('link', { name: 'Log in' })
    fireEvent.click(links[links.length - 1])
    await heading('Log in')
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'correct horse battery' } })
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await heading('Sony Alpha 7 IV')).toBeInTheDocument()
  })

  it('a logged-in user can rent', async () => {
    serve({ me: ada })
    renderAt('/devices/3')
    await screen.findByText('Ada')
    dates()
    expect(screen.getByRole('button', { name: /^rent$/i })).toBeEnabled()
  })

  it('when the server cannot say, the Rent button is there', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    renderAt('/devices/3')
    dates()
    expect(screen.getByRole('button', { name: /^rent$/i })).toBeEnabled()
  })
})
