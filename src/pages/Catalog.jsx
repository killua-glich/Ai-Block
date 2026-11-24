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
  const hasFilters = category !== 'All' || sort !== 'default' || query !== ''

  function resetFilters() {
    setCategory('All')
    setSort('default')
    setQuery('')
  }

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
        <div className="toolbar">
          <div className="filters">
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            <label>
              Sort by
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">Default</option>
                <option value="asc">Price: low to high</option>
                <option value="desc">Price: high to low</option>
              </select>
            </label>
          </div>
          <div className="toolbar-end">
            <p className="result-count">{sorted.length === 1 ? '1 device' : `${sorted.length} devices`}</p>
            {hasFilters && (
              <button type="button" className="button-ghost" onClick={resetFilters}>Reset filters</button>
            )}
          </div>
        </div>
        {visible.length === 0 ? (
          <div className="empty-state">
            <p>No devices found.</p>
          </div>
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
