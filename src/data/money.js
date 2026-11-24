export function formatEuro(amount) {
  return Number.isInteger(amount) ? `€${amount}` : `€${amount.toFixed(2)}`
}
