const KEY = 'ai-block-rentals'
export function getRentals() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}
export function addRental(rental) {
  const rentals = getRentals()
  rentals.push(rental)
  localStorage.setItem(KEY, JSON.stringify(rentals))
}
