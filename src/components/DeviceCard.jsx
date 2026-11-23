import { Link } from 'react-router-dom'

export default function DeviceCard({ device }) {
  return (
    <div className="card">
      <h3>{device.name}</h3>
      <p className="category">{device.category}</p>
      <p className="price">CHF {device.pricePerDay} / day</p>
      <Link to={`/devices/${device.id}`}>View details</Link>
    </div>
  )
}
