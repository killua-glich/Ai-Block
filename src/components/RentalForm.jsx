import { useState } from 'react'
import { postRental } from '../data/api.js'
import { formatEuro } from '../data/money.js'

export default function RentalForm({ device }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [serverError, setServerError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  let error = ''
  if (startDate && startDate < today) {
    error = 'Start date cannot be in the past.'
  } else if (startDate && endDate && endDate < startDate) {
    error = 'End date must be after start date.'
  }

  const days = startDate && endDate && !error ? Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1 : 0
  const total = days * device.pricePerDay

  async function handleRent() {
    setIsSaving(true)
    setServerError('')
    try {
      await postRental({ deviceId: device.id, startDate, endDate })
      setConfirmed(true)
      setStartDate('')
      setEndDate('')
    } catch (err) {
      setConfirmed(false)
      setServerError(err.message)
    } finally {
      setIsSaving(false)
    }
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
      {serverError && <p className="error">{serverError}</p>}
      {days > 0 && (
        <div className="summary">
          <p className="summary-days">{days} day(s)</p>
          <p className="summary-total">total {formatEuro(total)}</p>
        </div>
      )}
      <button type="button" disabled={!(days > 0 && device.available) || isSaving} onClick={handleRent}>
        Rent
      </button>
      {!device.available && <p>This device is currently not available.</p>}
      {confirmed && <p className="success" role="status">Rental confirmed!</p>}
    </div>
  )
}
