import { useParams, Link } from 'react-router-dom'
import devices from '../data/devices.js'
import RentalForm from '../components/RentalForm.jsx'
import { formatEuro } from '../data/money.js'

export default function DeviceDetail() {
  const { id } = useParams()
  const device = devices.find((d) => d.id === Number(id))

  if (!device) {
    return <p>Device not found. <Link to="/">Back to catalog</Link></p>
  }

  return (
    <section>
      <Link to="/">← Back</Link>
      <h1>{device.name}</h1>
      <p className="category">
        {device.category}{' '}
        <span className={device.available ? 'badge badge-ok' : 'badge badge-no'}>
          {device.available ? 'Available' : 'Not available'}
        </span>
      </p>
      <p>{device.description}</p>
      <ul>
        {device.specs.map((spec) => (
          <li key={spec}>{spec}</li>
        ))}
      </ul>
      <p className="price">{formatEuro(device.pricePerDay)} / day</p>
      <RentalForm device={device} />
    </section>
  )
}
