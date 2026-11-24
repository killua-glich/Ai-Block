import { getRentals } from '../data/rentals.js'
import devices from '../data/devices.js'

export default function MyRentals() {
  const rentals = getRentals()
  const today = new Date().toISOString().slice(0, 10)
  const active = rentals.filter((r) => r.endDate >= today)
  const past = rentals.filter((r) => r.endDate < today)

  if (rentals.length === 0) {
    return <p>You have no rentals yet.</p>
  }

  const renderTable = (list) => (
    <table>
      <thead>
        <tr>
          <th>Device</th>
          <th>From</th>
          <th>To</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {list.map((r, i) => (
          <tr key={r.id ?? `${r.deviceId}-${r.startDate}-${r.endDate}-${i}`}>
            <td>{devices.find((d) => d.id === r.deviceId)?.name ?? 'Unknown device'}</td>
            <td>{r.startDate}</td>
            <td>{r.endDate}</td>
            <td>CHF {r.totalPrice}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <>
      <h2>Active</h2>
      {active.length === 0 ? <p>None.</p> : renderTable(active)}
      <h2>Past</h2>
      {past.length === 0 ? <p>None.</p> : renderTable(past)}
    </>
  )
}
