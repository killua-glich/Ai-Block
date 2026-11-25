// Reads devices from the database, in the same shape the web site uses.
function toDevice(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    pricePerDay: row.price_per_day,
    description: row.description,
    specs: JSON.parse(row.specs),
    available: row.available === 1,
  }
}

export function listDevices(db) {
  return db.prepare('SELECT * FROM devices ORDER BY id').all().map(toDevice)
}

export function getDevice(db, id) {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(id)
  return row ? toDevice(row) : null
}

// An error with the HTTP status the API should answer with.
export class DeviceError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Checks the fields of a device from the admin form and returns them cleaned up.
function readDevice(input) {
  const { name, category, pricePerDay, description = '', specs = [], available = true } = input ?? {}
  const cleanName = typeof name === 'string' ? name.trim() : ''
  if (cleanName.length < 1 || cleanName.length > 120) throw new DeviceError(400, 'Please enter a name (up to 120 characters).')
  const cleanCategory = typeof category === 'string' ? category.trim() : ''
  if (cleanCategory.length < 1 || cleanCategory.length > 40) throw new DeviceError(400, 'Please enter a category (up to 40 characters).')
  if (typeof pricePerDay !== 'number' || !Number.isFinite(pricePerDay) || pricePerDay < 0) {
    throw new DeviceError(400, 'The price per day must be a number, zero or more.')
  }
  if (typeof description !== 'string' || description.length > 1000) {
    throw new DeviceError(400, 'The description must be text of up to 1000 characters.')
  }
  if (!Array.isArray(specs) || specs.length > 20 || specs.some((s) => typeof s !== 'string' || s.trim() === '')) {
    throw new DeviceError(400, 'The specs must be a list of up to 20 texts.')
  }
  if (typeof available !== 'boolean') throw new DeviceError(400, 'Available must be true or false.')
  return { name: cleanName, category: cleanCategory, pricePerDay, description, specs: specs.map((s) => s.trim()), available }
}

// A second device with the same name breaks the unique index: say so in plain words.
function rethrow(err) {
  if (/UNIQUE/.test(err.message)) throw new DeviceError(409, 'A device with that name already exists.')
  throw err
}

export function createDevice(db, input, now = new Date().toISOString()) {
  const d = readDevice(input)
  try {
    const result = db
      .prepare('INSERT INTO devices (name, category, price_per_day, description, specs, available, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(d.name, d.category, d.pricePerDay, d.description, JSON.stringify(d.specs), d.available ? 1 : 0, now)
    return getDevice(db, Number(result.lastInsertRowid))
  } catch (err) {
    return rethrow(err)
  }
}

export function updateDevice(db, id, input, now = new Date().toISOString()) {
  if (!getDevice(db, id)) throw new DeviceError(404, 'Device not found')
  const d = readDevice(input)
  try {
    db.prepare(
      'UPDATE devices SET name = ?, category = ?, price_per_day = ?, description = ?, specs = ?, available = ?, updated_at = ? WHERE id = ?',
    ).run(d.name, d.category, d.pricePerDay, d.description, JSON.stringify(d.specs), d.available ? 1 : 0, now, id)
  } catch (err) {
    rethrow(err)
  }
  return getDevice(db, id)
}

// A device that has rentals cannot be deleted: mark it as not available instead.
export function deleteDevice(db, id) {
  if (!getDevice(db, id)) throw new DeviceError(404, 'Device not found')
  try {
    db.prepare('DELETE FROM devices WHERE id = ?').run(id)
  } catch (err) {
    if (/FOREIGN KEY/.test(err.message)) {
      throw new DeviceError(409, 'This device has rentals and cannot be deleted. Mark it as not available instead.')
    }
    throw err
  }
}
