import { useState } from 'react'
import devices from '../data/devices.js'
import DeviceCard from '../components/DeviceCard.jsx'

export default function Catalog() {
  const categories = ['All', ...new Set(devices.map((d) => d.category))]
  const [category, setCategory] = useState('All')

  const visible = category === 'All' ? devices : devices.filter((d) => d.category === category)

  return (
    <section>
      <h1>Rent a device</h1>
      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      {visible.length === 0 ? (
        <p>No devices found.</p>
      ) : (
        <div className="grid">
          {visible.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </section>
  )
}
