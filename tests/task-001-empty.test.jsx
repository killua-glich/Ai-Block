import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import Catalog from '../src/pages/Catalog.jsx'
import { renderAt } from './helpers.jsx'

vi.mock('../src/data/devices.js', () => ({ default: [] }))

describe('001 empty state', () => {
  it('shows "No devices found." when nothing matches', () => {
    renderAt('/', <Catalog />)
    expect(screen.getByText('No devices found.')).toBeInTheDocument()
  })
})
