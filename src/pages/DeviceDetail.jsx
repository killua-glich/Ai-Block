import { useParams, Link } from 'react-router-dom'
import devices from '../data/devices.js'
import RentalForm from '../components/RentalForm.jsx'
import { formatEuro } from '../data/money.js'
import { categoryIcon, categoryHue } from '../data/categories.js'

export default function DeviceDetail() {
  const { id } = useParams()
  const device = devices.find((d) => d.id === Number(id))

  if (!device) {
    return <p>Device not found. <Link to="/">Back to catalog</Link></p>
  }

  return (
    <section>
      <Link to="/" className="back-link">← Back</Link>
      <div className="detail">
        <div className="detail-info">
          <div className="detail-media" style={{ '--hue': categoryHue(device.category) }} aria-hidden="true">
            <span className="detail-icon">{categoryIcon(device.category)}</span>
            <img className="detail-photo" src={`/devices/${device.id}.jpg`} alt="" onError={(e) => { e.currentTarget.hidden = true }} />
          </div>
          <h1>{device.name}</h1>
          <p className="category">
            {device.category}{' '}
            <span className={device.available ? 'badge badge-ok' : 'badge badge-no'}>
              {device.available ? 'Available' : 'Not available'}
            </span>
          </p>
          <p>{device.description}</p>
          <ul className="specs">
            {device.specs.map((spec) => (
              <li key={spec}>{spec}</li>
            ))}
          </ul>
          <p className="price price-tag">{formatEuro(device.pricePerDay)} / day</p>
        </div>
        <div className="detail-booking">
          <h2>Book this device</h2>
          <RentalForm device={device} />
        </div>
      </div>
    </section>
  )
}
