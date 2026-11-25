import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../data/AuthContext.jsx'
import { fetchDevices, createDeviceAdmin, updateDeviceAdmin, deleteDeviceAdmin } from '../data/api.js'
import { formatEuro } from '../data/money.js'

const EMPTY = { name: '', category: '', pricePerDay: '', description: '', specs: '', available: true }

function toForm(device) {
  return {
    name: device.name,
    category: device.category,
    pricePerDay: String(device.pricePerDay),
    description: device.description,
    specs: device.specs.join(', '),
    available: device.available,
  }
}

function toInput(form) {
  return {
    name: form.name,
    category: form.category,
    pricePerDay: Number(form.pricePerDay),
    description: form.description,
    specs: form.specs.split(',').map((s) => s.trim()).filter(Boolean),
    available: form.available,
  }
}

export default function Admin() {
  const { user, status } = useAuth()
  const [devices, setDevices] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true
    fetchDevices()
      .then((list) => {
        if (isActive) setDevices(list)
      })
      .catch((err) => {
        if (isActive) setError(err.message)
      })
    return () => {
      isActive = false
    }
  }, [])

  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/admin' }} />
  if (user && user.role !== 'admin') {
    return (
      <section>
        <h1>Admin</h1>
        <p className="error">Admins only.</p>
      </section>
    )
  }

  const change = (field) => (event) => setForm({ ...form, [field]: event.target.value })

  function startEdit(device) {
    setEditingId(device.id)
    setForm(toForm(device))
    setMessage('')
    setError('')
  }

  function stopEdit() {
    setEditingId(null)
    setForm(EMPTY)
  }

  async function save(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      if (editingId === null) await createDeviceAdmin(toInput(form))
      else await updateDeviceAdmin(editingId, toInput(form))
      setMessage(editingId === null ? 'Device added.' : 'Device saved.')
      stopEdit()
      setDevices(await fetchDevices())
    } catch (err) {
      setError(err.message)
    }
  }

  async function remove(device) {
    setError('')
    setMessage('')
    try {
      await deleteDeviceAdmin(device.id)
      setMessage(`${device.name} deleted.`)
      setDevices(await fetchDevices())
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section>
      <h1>Admin</h1>
      {message && <p className="success" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      <form className="admin-form" onSubmit={save}>
        <label>
          Name
          <input type="text" value={form.name} onChange={change('name')} required />
        </label>
        <label>
          Category
          <input type="text" value={form.category} onChange={change('category')} required />
        </label>
        <label>
          Price per day
          <input type="number" min="0" step="0.01" value={form.pricePerDay} onChange={change('pricePerDay')} required />
        </label>
        <label>
          Specs
          <input type="text" value={form.specs} onChange={change('specs')} placeholder="8K video, Waterproof" />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={change('description')} />
        </label>
        <label>
          <span>
            <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> Available
          </span>
        </label>
        <div className="admin-actions">
          <button type="submit">{editingId === null ? 'Add device' : 'Save changes'}</button>
          {editingId !== null && <button type="button" className="button-ghost" onClick={stopEdit}>Cancel editing</button>}
        </div>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Category</th>
              <th>Available</th>
              <th className="num">Price</th>
              <th><span className="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>{device.name}</td>
                <td>{device.category}</td>
                <td>{device.available ? 'Yes' : 'No'}</td>
                <td className="num">{formatEuro(device.pricePerDay)}</td>
                <td>
                  <button type="button" className="button-ghost" onClick={() => startEdit(device)}>Edit</button>{' '}
                  <button type="button" className="button-ghost" onClick={() => remove(device)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
