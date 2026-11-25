// The web site's door to the API. Every function returns the parsed JSON, or throws.
export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function request(path, options) {
  let res
  try {
    res = await fetch(path, options)
  } catch {
    throw new Error('Could not reach the server.')
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, body?.error ?? `Request failed (${res.status})`)
  return body
}

export const fetchDevices = () => request('/api/devices')

export const fetchDevice = (id) => request(`/api/devices/${id}`)

export const fetchRentals = () => request('/api/rentals')

// The server works out the price, the id and the time stamp: send only these three.
export const postRental = ({ deviceId, startDate, endDate }) =>
  request('/api/rentals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, startDate, endDate }),
  })
