// Styling: dark mode and a layout that fits a phone.
import { describe, it, expect } from 'vitest'
import { rule, cssText } from './css-helpers.js'

const DARK = 'prefers-color-scheme: dark'
const OVERRIDDEN = [
  '--color-bg', '--color-surface', '--color-text', '--color-muted', '--color-border', '--color-disabled',
  '--color-primary', '--color-primary-hover', '--shadow-sm', '--shadow', '--shadow-lg',
]

describe('019 dark mode and phone layout', () => {
  it('tells the browser the page supports both colour schemes', () => {
    const scheme = rule(':root')?.['color-scheme'] ?? ''
    expect(scheme).toContain('light')
    expect(scheme).toContain('dark')
  })

  it('a dark scheme replaces surfaces, text, borders, shadows and the primary colour', () => {
    const light = rule(':root')
    const dark = rule(':root', DARK)
    expect(dark).toBeDefined()
    for (const name of OVERRIDDEN) {
      expect(dark[name], name).toBeTruthy()
      expect(dark[name], `${name} differs from light`).not.toBe(light[name])
    }
  })

  it('the dark scheme keeps the status colours and the gradient', () => {
    const dark = rule(':root', DARK)
    for (const name of ['--color-success', '--color-danger', '--gradient-brand', '--radius']) expect(dark[name], name).toBeUndefined()
  })

  it('on a phone the header, hero, numbers and footer get tighter', () => {
    expect(rule('.header', 'max-width: 600px')?.padding).toBeTruthy()
    expect(rule('.nav a', 'max-width: 600px')?.padding).toBeTruthy()
    expect(rule('.hero', 'max-width: 600px')?.padding).toBeTruthy()
    expect(rule('.stats', 'max-width: 600px')?.gap).toBeTruthy()
    expect(rule('.footer', 'max-width: 600px')?.padding).toBeTruthy()
  })

  it('there is one phone block, not several with the same query', () => {
    expect(cssText().match(/@media \(max-width: 600px\)/g) ?? []).toHaveLength(1)
    expect(rule('.container', 'max-width: 600px')).toBeDefined()
    expect(rule('.toolbar', 'max-width: 600px')).toBeDefined()
  })
})
