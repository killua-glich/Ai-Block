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
