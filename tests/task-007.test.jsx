import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderAt } from './helpers.jsx'

describe('007 404 page', () => {
  it('unknown URLs show Page not found with a link home', () => {
    renderAt('/this/does/not/exist')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to devices/i })).toHaveAttribute('href', '/')
  })
})
