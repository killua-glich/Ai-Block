import { useState } from 'react'
import { addRental } from '../data/rentals'

export default function RentalForm({ device }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  let error = ''
  if (startDate && startDate < today) {
    error = 'Start date cannot be in the past.'
  } else if (startDate && endDate && endDate < startDate) {
    error = 'End date must be after start date.'
  }

  const days = startDate && endDate && !error ? Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1 : 0
  const total = days * device.pricePerDay

  function handleRent() {
    addRental({ id: crypto.randomUUID(), deviceId: device.id, startDate, endDate, totalPrice: total, createdAt: new Date().toISOString() })
    setConfirmed(true)
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="rental-form">
      <label>
        Start date{' '}
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>
      <label>
        End date{' '}
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      {days > 0 && <p>{days} day(s) — total CHF {total}</p>}
      <button type="button" disabled={!(days > 0 && device.available)} onClick={handleRent}>
        Rent
      </button>
      {!device.available && <p>This device is currently not available.</p>}
      {confirmed && <p className="success">Rental confirmed!</p>}
    </div>
  )
}
