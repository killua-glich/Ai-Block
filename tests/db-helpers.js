// Raw inserts for tests that look at the database itself. They work with every schema version:
// they look at the columns the tables have, because later schema versions rename some of them
// (price_per_day and total_price become whole cents, category becomes a link to a categories table).
const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)

// Prices are given in euros, as the site shows them.
export function insertDevice(db, { id, name = 'Test', category = 'Laptop', price = 10, available } = {}) {
  const has = columns(db, 'devices')
  const fields = ['id', 'name']
  const values = [id, name]
  if (has.includes('category_id')) {
    db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(category)
    fields.push('category_id')
    values.push(db.prepare('SELECT id FROM categories WHERE name = ?').get(category).id)
  } else {
    fields.push('category')
    values.push(category)
  }
  if (has.includes('price_cents')) {
    fields.push('price_cents')
    values.push(Math.round(price * 100))
  } else {
    fields.push('price_per_day')
    values.push(price)
  }
  if (available !== undefined) {
    fields.push('available')
    values.push(available)
  }
  return db.prepare(`INSERT INTO devices (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`).run(...values)
}

// Only the fields that are given are sent, so a test can leave out `status` and `cancelledAt`.
export function insertRental(db, { id, deviceId, start = '2099-01-01', end = '2099-01-02', total = 10, createdAt = 'x', status, cancelledAt, userId } = {}) {
  const has = columns(db, 'rentals')
  const fields = ['id', 'device_id', 'start_date', 'end_date', 'created_at']
  const values = [id, deviceId, start, end, createdAt]
  if (has.includes('total_cents')) {
    fields.push('total_cents')
    values.push(Math.round(total * 100))
  } else {
    fields.push('total_price')
    values.push(total)
  }
  if (status !== undefined) {
    fields.push('status')
    values.push(status)
  }
  if (cancelledAt !== undefined) {
    fields.push('cancelled_at')
    values.push(cancelledAt)
  }
  if (userId !== undefined) {
    fields.push('user_id')
    values.push(userId)
  }
  return db.prepare(`INSERT INTO rentals (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`).run(...values)
}
