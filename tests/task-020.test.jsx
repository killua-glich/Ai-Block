// Styling: a photo behind the catalog hero, with a dark overlay that keeps the text readable.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

describe('020 hero photo', () => {
  it('the photo file is in public/', () => {
    expect(existsSync('public/hero.png')).toBe(true)
  })

  it('the hero starts with a decorative photo and keeps all its text', () => {
    renderAt('/')
    const hero = document.querySelector('.hero')
    const photo = hero.querySelector('img.hero-image')
    expect(photo).toBeTruthy()
    expect(photo).toHaveAttribute('src', '/hero.png')
    expect(photo).toHaveAttribute('alt', '')
    expect(photo).toHaveAttribute('aria-hidden', 'true')
    expect(hero.firstElementChild).toBe(photo)
    expect(hero.querySelector('h1')).toBeTruthy()
    expect(hero.querySelector('input[type="search"]')).toBeTruthy()
    expect(hero.querySelectorAll('.stats li').length).toBe(2)
  })

  it('the hero clips the photo and keeps its brand gradient as a fallback', () => {
    const hero = rule('.hero')
    expect(hero?.position).toBe('relative')
    expect(hero?.overflow).toBe('hidden')
    expect(hero?.isolation).toBe('isolate')
    expect(hero?.background).toContain('var(--gradient-brand)')
  })

  it('the photo fills the hero, behind the text', () => {
    const photo = rule('.hero-image')
    expect(photo?.position).toBe('absolute')
    expect(photo?.inset).toBe('0')
    expect(photo?.['z-index']).toBe('-1')
    expect(photo?.width).toBe('100%')
    expect(photo?.height).toBe('100%')
    expect(photo?.['object-fit']).toBe('cover')
  })

  it('a dark overlay on the photo keeps the text readable', () => {
    const overlay = rule('.hero::after')
    expect(overlay).toBeDefined()
    expect(overlay.content).toBe('""')
    expect(overlay.position).toBe('absolute')
    expect(overlay.inset).toBe('0')
    expect(overlay['z-index']).toBe('-1')
    expect(overlay['pointer-events']).toBe('none')
    expect(overlay.background).toContain('linear-gradient')
  })
})
