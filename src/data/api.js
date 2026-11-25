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

const jsonSend = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// Who is logged in: the user, or null when nobody is (the server answers 401). Other errors are thrown.
export async function fetchMe() {
  try {
    const body = await request('/api/auth/me')
    return body.user
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null
    throw err
  }
}

export const registerUser = ({ email, name, password }) =>
  request('/api/auth/register', jsonSend('POST', { email, name, password })).then((body) => body.user)

export const loginUser = ({ email, password }) =>
  request('/api/auth/login', jsonSend('POST', { email, password })).then((body) => body.user)

export const logoutUser = () => request('/api/auth/logout', { method: 'POST' })

export const cancelRentalById = (id) => request(`/api/rentals/${id}/cancel`, { method: 'POST' })

export const createDeviceAdmin = (device) => request('/api/devices', jsonSend('POST', device))

export const updateDeviceAdmin = (id, device) => request(`/api/devices/${id}`, jsonSend('PUT', device))

export const deleteDeviceAdmin = (id) => request(`/api/devices/${id}`, { method: 'DELETE' })
