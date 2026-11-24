import { Link } from 'react-router-dom'
import { getRentals } from '../data/rentals.js'
import devices from '../data/devices.js'
import { formatEuro } from '../data/money.js'
import { categoryIcon } from '../data/categories.js'

export default function MyRentals() {
  const rentals = getRentals()
  const today = new Date().toISOString().slice(0, 10)
  const active = rentals.filter((r) => r.endDate >= today)
  const past = rentals.filter((r) => r.endDate < today)

  if (rentals.length === 0) {
    return (
      <section>
        <h1>My rentals</h1>
        <div className="empty-state">
          <p>You have no rentals yet.</p>
          <Link to="/">Browse devices</Link>
        </div>
      </section>
    )
  }

  const renderTable = (list, status) => (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Device</th>
            <th>From</th>
            <th>To</th>
            <th>Status</th>
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => {
            const device = devices.find((d) => d.id === r.deviceId)
            return (
              <tr key={r.id ?? `${r.deviceId}-${r.startDate}-${r.endDate}-${i}`}>
                <td>
                  <span className="row-icon" aria-hidden="true">{device ? categoryIcon(device.category) : '📦'}</span>
                  {device?.name ?? 'Unknown device'}
                </td>
                <td>{r.startDate}</td>
                <td>{r.endDate}</td>
                <td>
                  <span className={status === 'active' ? 'chip chip-active' : 'chip chip-past'}>
                    {status === 'active' ? 'Active' : 'Past'}
                  </span>
                </td>
                <td className="num">{formatEuro(r.totalPrice)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <section>
      <h1>My rentals</h1>
      <h2>Active</h2>
      {active.length === 0 ? <p className="muted">None.</p> : renderTable(active, 'active')}
      <h2>Past</h2>
      {past.length === 0 ? <p className="muted">None.</p> : renderTable(past, 'past')}
    </section>
  )
}
