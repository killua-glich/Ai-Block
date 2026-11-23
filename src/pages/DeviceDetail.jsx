import { useParams, Link } from 'react-router-dom'
import devices from '../data/devices.js'

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
      <p className="category">{device.category}</p>
      <p>{device.description}</p>
      <p className="price">CHF {device.pricePerDay} / day</p>
      <button disabled>Rent (coming soon)</button>
    </section>
  )
}
