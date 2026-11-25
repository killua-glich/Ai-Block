// Web site: the admin page, where admins add, change and delete devices.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { screen, fireEvent, within, waitFor } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

const reply = (status, body) => ({ ok: status < 400, status, json: async () => body })
const ada = { id: 1, email: 'ada@example.com', name: 'Ada', role: 'user' }
const boss = { id: 2, email: 'boss@example.com', name: 'Boss', role: 'admin' }

afterEach(() => vi.unstubAllGlobals())

// A fake server with a device list that the admin can change.
function adminServer(me, { failWith } = {}) {
  const list = devices.map((d) => ({ ...d }))
  const calls = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, options = {}) => {
      const method = options.method ?? 'GET'
      const body = options.body ? JSON.parse(options.body) : undefined
      calls.push({ url, method, body })
      if (url === '/api/auth/me') return me ? reply(200, { user: me }) : reply(401, { error: 'Not logged in.' })
      if (url === '/api/devices' && method === 'GET') return reply(200, list)
      if (failWith && method !== 'GET') return reply(failWith.status, { error: failWith.error })
      if (url === '/api/devices' && method === 'POST') {
        const device = { id: list.length + 1, ...body }
        list.push(device)
        return reply(201, device)
      }
      const id = Number(url.split('/').pop())
      const index = list.findIndex((d) => d.id === id)
      if (method === 'PUT') {
        list[index] = { id, ...body }
        return reply(200, list[index])
      }
      if (method === 'DELETE') {
        list.splice(index, 1)
        return reply(204, null)
      }
      return reply(404, { error: 'Not found' })
    }),
  )
  return calls
}

const rows = () => [...document.querySelectorAll('tbody tr')]
const rowOf = (name) => screen.getByText(name).closest('tr')
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })
const fillNew = () => {
  type('Name', 'Insta360 X4')
  type('Category', 'Camera')
  type('Price per day', '30')
  type('Specs', '8K video, Waterproof')
  type('Description', '360 degree camera.')
}

describe('048 admin page', () => {
  it('a normal user is told this is for admins only, and there is no form', async () => {
    adminServer(ada)
    renderAt('/admin')
    expect(await screen.findByText('Admins only.')).toHaveClass('error')
    expect(document.querySelector('.admin-form')).toBeNull()
  })

  it('a visitor who is not logged in is sent to the login page', async () => {
    adminServer(null)
    renderAt('/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument()
  })

  it('an admin sees every device in a table with Edit and Delete buttons', async () => {
    adminServer(boss)
    renderAt('/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Admin' })).toBeInTheDocument()
    await waitFor(() => expect(rows()).toHaveLength(14))
    const row = rowOf(devices[2].name)
    expect(row).toHaveTextContent(devices[2].category)
    expect(row).toHaveTextContent('€40')
    expect(within(row).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(rowOf(devices[11].name)).toHaveTextContent('No')
  })

  it('adding a device sends the fields as the server wants them, then shows it in the table', async () => {
    const calls = adminServer(boss)
    renderAt('/admin')
    await waitFor(() => expect(rows()).toHaveLength(14))
    fillNew()
    fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
    expect(await screen.findByText('Device added.')).toHaveClass('success')
    await waitFor(() => expect(rows()).toHaveLength(15))
    expect(rowOf('Insta360 X4')).toHaveTextContent('€30')
    expect(calls.find((c) => c.method === 'POST').body).toEqual({
      name: 'Insta360 X4',
      category: 'Camera',
      pricePerDay: 30,
      description: '360 degree camera.',
      specs: ['8K video', 'Waterproof'],
      available: true,
    })
    expect(screen.getByLabelText('Name')).toHaveValue('')
  })

  it('the Available box decides whether a new device can be rented', async () => {
    const calls = adminServer(boss)
    renderAt('/admin')
    await waitFor(() => expect(rows()).toHaveLength(14))
    fillNew()
    fireEvent.click(screen.getByLabelText('Available'))
    fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
    await screen.findByText('Device added.')
    expect(calls.find((c) => c.method === 'POST').body.available).toBe(false)
  })

  it('Edit fills the form, Save changes sends a PUT, and the table shows the change', async () => {
    const calls = adminServer(boss)
    renderAt('/admin')
    await waitFor(() => expect(rows()).toHaveLength(14))
    fireEvent.click(within(rowOf(devices[2].name)).getByRole('button', { name: 'Edit' }))
    expect(screen.getByLabelText('Name')).toHaveValue(devices[2].name)
    expect(screen.getByLabelText('Price per day')).toHaveValue(40)
    expect(screen.getByLabelText('Specs')).toHaveValue(devices[2].specs.join(', '))
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()

    type('Name', 'Renamed Camera')
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Device saved.')).toBeInTheDocument()
    await screen.findByText('Renamed Camera')
    const put = calls.find((c) => c.method === 'PUT')
    expect(put.url).toBe('/api/devices/3')
    expect(put.body).toMatchObject({ name: 'Renamed Camera', pricePerDay: 40 })
    expect(screen.getByRole('button', { name: 'Add device' })).toBeInTheDocument()
  })

  it('Cancel editing empties the form again', async () => {
    adminServer(boss)
    renderAt('/admin')
    await waitFor(() => expect(rows()).toHaveLength(14))
    fireEvent.click(within(rowOf(devices[2].name)).getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel editing' }))
    expect(screen.getByLabelText('Name')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Add device' })).toBeInTheDocument()
  })

  it('Delete removes the device and says so', async () => {
    const calls = adminServer(boss)
    renderAt('/admin')
    await waitFor(() => expect(rows()).toHaveLength(14))
    fireEvent.click(within(rowOf(devices[13].name)).getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText(`${devices[13].name} deleted.`)).toBeInTheDocument()
    await waitFor(() => expect(rows()).toHaveLength(13))
    expect(calls.some((c) => c.method === 'DELETE' && c.url === '/api/devices/14')).toBe(true)
  })

  it('shows the message of the server when it refuses, and keeps what was typed', async () => {
    adminServer(boss, { failWith: { status: 409, error: 'A device with that name already exists.' } })
    renderAt('/admin')
    await waitFor(() => expect(rows()).toHaveLength(14))
    fillNew()
    fireEvent.click(screen.getByRole('button', { name: 'Add device' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('A device with that name already exists.')
    expect(screen.getByLabelText('Name')).toHaveValue('Insta360 X4')
    expect(rows()).toHaveLength(14)
  })

  it('the form is a card with a grid of fields', () => {
    const form = rule('.admin-form')
    expect(form?.display).toBe('grid')
    expect(form?.['grid-template-columns']).toContain('auto-fit')
    expect(form?.background).toBe('var(--color-surface)')
    expect(form?.['border-radius']).toBe('var(--radius)')
    expect(rule('.admin-form label')?.['text-transform']).toBe('uppercase')
    expect(rule('.admin-form input:not([type="checkbox"])')?.border).toBe('1px solid var(--color-border)')
    expect(rule('.admin-form textarea')?.['min-height']).toBe('5rem')
    expect(rule('.admin-actions')?.display).toBe('flex')
  })
})
