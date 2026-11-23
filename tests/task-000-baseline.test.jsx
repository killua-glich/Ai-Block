// Always runs: the app must keep working no matter which task is done.
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { renderAt } from './helpers.jsx'

describe('baseline', () => {
  it('catalog shows one card per device', () => {
    renderAt('/')
    expect(screen.getAllByRole('link', { name: /view details/i })).toHaveLength(devices.length)
  })

  it('detail page shows the device name', () => {
    renderAt(`/devices/${devices[0].id}`)
    expect(screen.getByRole('heading', { level: 1, name: devices[0].name })).toBeInTheDocument()
  })

  it('header links back to the catalog', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: 'Ai-Block' })).toHaveAttribute('href', '/')
  })
})
