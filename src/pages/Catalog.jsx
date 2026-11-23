import { useState } from 'react'
import devices from '../data/devices.js'
import DeviceCard from '../components/DeviceCard.jsx'

export default function Catalog() {
  const categories = ['All', ...new Set(devices.map((d) => d.category))]
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('default')

  const visible = category === 'All' ? devices : devices.filter((d) => d.category === category)

  const sorted = [...visible].sort((a, b) => {
    if (sort === 'asc') return a.pricePerDay - b.pricePerDay
    if (sort === 'desc') return b.pricePerDay - a.pricePerDay
    return 0
  })

  return (
    <section>
      <h1>Rent a device</h1>
      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="default">Default</option>
          <option value="asc">Price: low to high</option>
          <option value="desc">Price: high to low</option>
        </select>
      </div>
      {visible.length === 0 ? (
        <p>No devices found.</p>
      ) : (
        <div className="grid">
          {sorted.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </section>
  )
}
