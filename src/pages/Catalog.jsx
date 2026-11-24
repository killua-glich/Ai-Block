import { useState } from 'react'
import devices from '../data/devices.js'
import DeviceCard from '../components/DeviceCard.jsx'

export default function Catalog() {
  const categories = ['All', ...new Set(devices.map((d) => d.category))]
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('default')
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()
  const visible = devices
    .filter((d) => category === 'All' || d.category === category)
    .filter((d) => d.name.toLowerCase().includes(needle))

  const sorted = [...visible].sort((a, b) => {
    if (sort === 'asc') return a.pricePerDay - b.pricePerDay
    if (sort === 'desc') return b.pricePerDay - a.pricePerDay
    return 0
  })

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Rent by the day</p>
        <h1>Tech you need, <span className="accent">without buying it</span></h1>
        <p className="lead">Laptops, cameras, drones and more. Pick a device, pick your dates, done.</p>
        <label className="search">
          <span className="visually-hidden">Search devices</span>
          <input
            type="search"
            placeholder="Search devices, e.g. MacBook"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <ul className="stats">
          <li><strong>{devices.length}</strong> devices</li>
          <li><strong>{categories.length - 1}</strong> categories</li>
        </ul>
      </section>
      <section>
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
    </>
  )
}
