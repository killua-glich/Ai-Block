// Web site: the API client knows accounts, and the AuthProvider tells every page who is logged in.
import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import devices from '../src/data/devices.js'
import {
  fetchMe, registerUser, loginUser, logoutUser, cancelRentalById,
  createDeviceAdmin, updateDeviceAdmin, deleteDeviceAdmin, ApiError,
} from '../src/data/api.js'
import { AuthProvider, useAuth } from '../src/data/AuthContext.jsx'
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

describe('043 API client: accounts and admin', () => {
  it('fetchMe gives the user, null for 401, and throws for anything else', async () => {
    serve({ me: ada })
    expect(await fetchMe()).toEqual(ada)
    serve({ me: null })
    expect(await fetchMe()).toBeNull()
    serve({ routes: { 'GET /api/auth/me': reply(500, { error: 'Something went wrong' }) } })
    expect(await fetchMe().catch((e) => e)).toBeInstanceOf(ApiError)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    expect((await fetchMe().catch((e) => e)).message).toBe('Could not reach the server.')
  })

  it('registerUser and loginUser send only what the server needs and give back the user', async () => {
    const calls = serve({ routes: { 'POST /api/auth/register': reply(201, { user: ada }), 'POST /api/auth/login': reply(200, { user: ada }) } })
    expect(await registerUser({ email: 'a@b.c', name: 'Ada', password: 'long enough', role: 'admin' })).toEqual(ada)
    expect(calls[0]).toEqual({ url: '/api/auth/register', method: 'POST', body: { email: 'a@b.c', name: 'Ada', password: 'long enough' } })
    expect(await loginUser({ email: 'a@b.c', password: 'long enough', extra: 1 })).toEqual(ada)
    expect(calls[1].body).toEqual({ email: 'a@b.c', password: 'long enough' })
    expect(globalThis.fetch.mock.calls[0][1].headers['Content-Type']).toBe('application/json')
  })

  it('logoutUser and cancelRentalById are POST requests to the right address', async () => {
    const calls = serve({ routes: { 'POST /api/auth/logout': reply(204, null), 'POST /api/rentals/abc/cancel': reply(200, { id: 'abc', status: 'cancelled' }) } })
    await logoutUser()
    expect(await cancelRentalById('abc')).toEqual({ id: 'abc', status: 'cancelled' })
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['POST /api/auth/logout', 'POST /api/rentals/abc/cancel'])
  })

  it('the admin functions create (POST), change (PUT) and delete (DELETE) a device', async () => {
    const calls = serve({
      routes: {
        'POST /api/devices': reply(201, { id: 15 }),
        'PUT /api/devices/3': reply(200, { id: 3 }),
        'DELETE /api/devices/3': reply(204, null),
      },
    })
    await createDeviceAdmin({ name: 'X' })
    await updateDeviceAdmin(3, { name: 'Y' })
    await deleteDeviceAdmin(3)
    expect(calls).toEqual([
      { url: '/api/devices', method: 'POST', body: { name: 'X' } },
      { url: '/api/devices/3', method: 'PUT', body: { name: 'Y' } },
      { url: '/api/devices/3', method: 'DELETE', body: undefined },
    ])
  })

  it('an error answer becomes an ApiError with the message of the server', async () => {
    serve({ routes: { 'POST /api/devices': reply(409, { error: 'A device with that name already exists.' }) } })
    const err = await createDeviceAdmin({}).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.message).toBe('A device with that name already exists.')
  })
})

function Show() {
  const { user, status, login, register, logout } = useAuth()
  const [note, setNote] = useState('')
  return (
    <div>
      <p>{`${status}:${user?.name ?? '-'}`}</p>
      <p>{note}</p>
      <button onClick={() => login({ email: 'a@b.c', password: 'long enough' }).catch((e) => setNote(e.message))}>do login</button>
      <button onClick={() => register({ email: 'a@b.c', name: 'Ada', password: 'long enough' }).catch((e) => setNote(e.message))}>do register</button>
      <button onClick={() => logout().catch((e) => setNote(e.message))}>do logout</button>
    </div>
  )
}

describe('043 AuthProvider', () => {
  it('without a provider the status is unknown and nothing breaks', () => {
    render(<Show />)
    expect(screen.getByText('unknown:-')).toBeInTheDocument()
  })

  it('starts as loading, then shows the user the cookie belongs to', async () => {
    serve({ me: ada })
    render(<AuthProvider><Show /></AuthProvider>)
    expect(screen.getByText('loading:-')).toBeInTheDocument()
    expect(await screen.findByText('user:Ada')).toBeInTheDocument()
  })

  it('is anonymous when the server answers 401', async () => {
    serve({ me: null })
    render(<AuthProvider><Show /></AuthProvider>)
    expect(await screen.findByText('anonymous:-')).toBeInTheDocument()
  })

  it('is unknown when the server breaks or cannot be reached', async () => {
    serve({ routes: { 'GET /api/auth/me': reply(500, { error: 'x' }) } })
    const first = render(<AuthProvider><Show /></AuthProvider>)
    expect(await screen.findByText('unknown:-')).toBeInTheDocument()
    first.unmount()

    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    render(<AuthProvider><Show /></AuthProvider>)
    expect(await screen.findByText('unknown:-')).toBeInTheDocument()
  })

  it('login logs in: the user is known afterwards', async () => {
    const calls = serve({ me: null, routes: { 'POST /api/auth/login': reply(200, { user: ada }) } })
    render(<AuthProvider><Show /></AuthProvider>)
    await screen.findByText('anonymous:-')
    fireEvent.click(screen.getByText('do login'))
    expect(await screen.findByText('user:Ada')).toBeInTheDocument()
    expect(calls.find((c) => c.url === '/api/auth/login').body).toEqual({ email: 'a@b.c', password: 'long enough' })
  })

  it('a failed login throws the message of the server and changes nothing', async () => {
    serve({ me: null, routes: { 'POST /api/auth/login': reply(401, { error: 'Wrong email or password.' }) } })
    render(<AuthProvider><Show /></AuthProvider>)
    await screen.findByText('anonymous:-')
    fireEvent.click(screen.getByText('do login'))
    expect(await screen.findByText('Wrong email or password.')).toBeInTheDocument()
    expect(screen.getByText('anonymous:-')).toBeInTheDocument()
  })

  it('register logs in at once', async () => {
    serve({ me: null, routes: { 'POST /api/auth/register': reply(201, { user: ada }) } })
    render(<AuthProvider><Show /></AuthProvider>)
    await screen.findByText('anonymous:-')
    fireEvent.click(screen.getByText('do register'))
    expect(await screen.findByText('user:Ada')).toBeInTheDocument()
  })

  it('logout makes the visitor anonymous, even when the request fails', async () => {
    serve({ me: ada, routes: { 'POST /api/auth/logout': reply(204, null) } })
    const first = render(<AuthProvider><Show /></AuthProvider>)
    await screen.findByText('user:Ada')
    fireEvent.click(screen.getByText('do logout'))
    expect(await screen.findByText('anonymous:-')).toBeInTheDocument()
    first.unmount()

    serve({ me: ada, routes: { 'POST /api/auth/logout': () => { throw new TypeError('Failed to fetch') } } })
    render(<AuthProvider><Show /></AuthProvider>)
    await screen.findByText('user:Ada')
    fireEvent.click(screen.getByText('do logout'))
    expect(await screen.findByText('anonymous:-')).toBeInTheDocument()
  })

  it('the whole site is wrapped in the provider: it asks who is logged in', async () => {
    const calls = serve({ me: ada })
    renderAt('/')
    await screen.findAllByRole('heading', { level: 3 })
    expect(calls.some((c) => c.url === '/api/auth/me')).toBe(true)
    expect(devices.length).toBe(14)
  })
})
