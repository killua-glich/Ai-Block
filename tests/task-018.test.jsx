// Styling: a 404 page with a huge gradient number, a fade between pages, and respect for reduced motion.
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

describe('018 not-found page and motion', () => {
  it('shows a big decorative 404, the heading, a muted text and the way home', () => {
    renderAt('/this/page/does/not/exist')
    const page = document.querySelector('.not-found')
    expect(page).toBeTruthy()
    expect(page.querySelector('.not-found-code')).toHaveTextContent('404')
    expect(page.querySelector('.not-found-code')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(page.querySelector('p.muted')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Back to devices' })).toHaveAttribute('href', '/')
  })

  it('the 404 number is filled with the brand gradient', () => {
    const code = rule('.not-found-code')
    expect(code?.background).toContain('var(--gradient-brand)')
    expect(code?.['background-clip']).toBe('text')
    expect(code?.['-webkit-background-clip']).toBe('text')
    expect(code?.color).toBe('transparent')
    expect(code?.['font-size']).toContain('clamp(')
    expect(rule('.not-found')?.['text-align']).toBe('center')
  })

  it('pages fade in', () => {
    expect(rule('.container')?.animation).toContain('fade')
    expect(rule('from', '@keyframes fade')?.opacity).toBe('0')
    expect(rule('to', '@keyframes fade')?.opacity).toBe('1')
  })

  it('people who ask for less motion get none', () => {
    const calm = rule('*, *::before, *::after', 'prefers-reduced-motion: reduce')
    expect(calm).toBeDefined()
    expect(calm['animation-duration']).toContain('0.01ms')
    expect(calm['transition-duration']).toContain('0.01ms')
    expect(calm['animation-iteration-count']).toContain('1')
  })
})
