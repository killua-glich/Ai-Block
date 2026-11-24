import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App.jsx'

export function renderAt(path, ui = <App />) {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)
}

// Device prices shown on catalog cards, in display order.
export function shownPrices(screen) {
  return screen.getAllByText(/(?:CHF|€)\s*\d+(\.\d+)?\s*\/\s*day/).map((el) => Number(el.textContent.match(/\d+(\.\d+)?/)[0]))
}
