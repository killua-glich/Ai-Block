// Styling: glass header with a logo mark, a pill navigation, and a footer.
import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

describe('011 header and footer', () => {
  it('marks the current page in the navigation', () => {
    renderAt('/rentals')
    expect(screen.getByRole('link', { name: 'My rentals' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Devices' })).not.toHaveAttribute('aria-current')
    renderAt('/')
  })

  it('the nav has a class and no inline style; the logo has a decorative mark and still goes home', () => {
    renderAt('/')
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('nav')
    expect(nav).not.toHaveAttribute('style')

    const logo = screen.getByRole('link', { name: 'Ai-Block' })
    expect(logo).toHaveAttribute('href', '/')
    expect(logo.querySelector('.logo-mark')).toHaveAttribute('aria-hidden', 'true')
  })

  it('every page has a footer with a copyright line and two links', () => {
    renderAt('/rentals')
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveClass('footer')
    expect(footer).toHaveTextContent('© 2026 Ai-Block')
    expect(within(footer).getByRole('link', { name: 'Catalog' })).toHaveAttribute('href', '/')
    expect(within(footer).getByRole('link', { name: 'Bookings' })).toHaveAttribute('href', '/rentals')
    expect(screen.getAllByRole('navigation')).toHaveLength(1)
  })

  it('the header is a sticky frosted-glass bar', () => {
    const header = rule('.header')
    expect(header?.position).toBe('sticky')
    expect(header?.top).toMatch(/^0(px)?$/)
    expect(header?.['z-index']).toBeTruthy()
    expect(header?.['backdrop-filter']).toContain('blur(')
    expect(header?.background).toContain('var(--color-surface)')
  })

  it('the logo mark is a gradient tile', () => {
    expect(rule('.logo-mark')?.background).toContain('var(--gradient-brand)')
    expect(rule('.logo-mark')?.['border-radius']).toBeTruthy()
  })

  it('the navigation is made of pills and the current one is highlighted', () => {
    expect(rule('.nav')?.display).toBe('flex')
    expect(rule('.nav a')?.['border-radius']).toBe('999px')
    expect(rule('.nav a:hover')).toBeDefined()
    expect(Object.values(rule('.nav a[aria-current="page"]') ?? {}).join(' ')).toContain('var(--color-primary)')
  })

  it('the page is a column, so the footer sits at the bottom of a short page', () => {
    const root = rule('#root')
    expect(root?.display).toBe('flex')
    expect(root?.['flex-direction']).toBe('column')
    expect(root?.['min-height']).toBe('100vh')
    expect(rule('.container')?.flex).toBe('1')
  })

  it('the footer has a top border and a row of links', () => {
    expect(rule('.footer')?.['border-top']).toContain('var(--color-border)')
    expect(rule('.footer-links')?.display).toBe('flex')
  })
})
