import { Link } from 'react-router-dom'
import { formatEuro } from '../data/money.js'
import { categoryIcon, categoryHue } from '../data/categories.js'

export default function DeviceCard({ device }) {
  return (
    <article className={device.available ? 'card' : 'card card-unavailable'}>
      <div className="card-media" style={{ '--hue': categoryHue(device.category) }} aria-hidden="true">
        <span className="card-icon">{categoryIcon(device.category)}</span>
      </div>
      <div className="card-body">
        <span className="chip">{device.category}</span>
        <h3>{device.name}</h3>
        <p className="price">{formatEuro(device.pricePerDay)} / day</p>
        <span className={device.available ? 'badge badge-ok' : 'badge badge-no'}>
          {device.available ? 'Available' : 'Not available'}
        </span>
        <Link to={`/devices/${device.id}`} className="view-link">View details</Link>
      </div>
    </article>
  )
}
