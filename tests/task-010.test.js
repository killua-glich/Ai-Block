// Styling: a bold design system. Colours, radius, shadows, fonts and the brand gradient as CSS variables.
import { describe, it, expect } from 'vitest'
import { rule, hexColoursOutsideRoot } from './css-helpers.js'

const VARS = [
  '--color-bg', '--color-surface', '--color-text', '--color-muted', '--color-border',
  '--color-primary', '--color-primary-hover', '--color-accent', '--color-highlight', '--color-on-primary',
  '--color-disabled', '--color-success', '--color-danger', '--gradient-brand',
  '--radius', '--radius-sm', '--shadow-sm', '--shadow', '--shadow-lg', '--font-body', '--font-display',
]

// [selector, property, variable that the value must use]
const USES = [
  ['body', 'color', '--color-text'],
  ['body', 'background', '--color-bg'],
  ['body', 'font-family', '--font-body'],
  ['a', 'color', '--color-primary'],
  ['.header', 'background', '--color-surface'],
  ['.header', 'border-bottom', '--color-border'],
  ['.logo', 'color', '--color-text'],
  ['.card', 'background', '--color-surface'],
  ['.card', 'border', '--color-border'],
  ['.card', 'border-radius', '--radius'],
  ['.card', 'box-shadow', '--shadow-sm'],
  ['.category', 'color', '--color-muted'],
  ['button', 'background', '--color-primary'],
  ['button', 'color', '--color-on-primary'],
  ['button', 'border-radius', '--radius-sm'],
  ['button:hover:not(:disabled)', 'background', '--color-primary-hover'],
  ['button:disabled', 'background', '--color-disabled'],
  ['.badge', 'color', '--color-on-primary'],
  ['.badge-ok', 'background', '--color-success'],
  ['.badge-no', 'background', '--color-danger'],
  ['.error', 'color', '--color-danger'],
  ['.success', 'color', '--color-success'],
  ['h1, h2, h3', 'font-family', '--font-display'],
]

describe('010 design system', () => {
  it('defines every colour, radius, shadow, font and the brand gradient on :root', () => {
    const root = rule(':root')
    expect(root).toBeDefined()
    for (const name of VARS) expect(root[name], name).toBeTruthy()
  })

  it('the brand gradient has three colour stops', () => {
    const gradient = rule(':root')?.['--gradient-brand'] ?? ''
    expect(gradient).toContain('linear-gradient(')
    expect((gradient.match(/#[0-9a-fA-F]{3,8}/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it.each(USES)('%s { %s } uses var(%s)', (selector, property, name) => {
    expect(rule(selector)?.[property]).toContain(`var(${name})`)
  })

  it('no colour is written as a hex value outside :root', () => {
    expect(hexColoursOutsideRoot()).toEqual([])
  })

  it('headings are large, tight and fluid', () => {
    expect(rule('h1, h2, h3')?.['letter-spacing']).toBe('-0.02em')
    expect(rule('h1')?.['font-size']).toContain('clamp(')
    expect(rule('body')?.['line-height']).toBe('1.5')
  })
})
