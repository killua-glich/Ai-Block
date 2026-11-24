// Styling and feature: a hero banner with a live search and a few numbers.
import { describe, it, expect } from 'vitest'
import { screen, fireEvent, within } from '@testing-library/react'
import devices from '../src/data/devices.js'
import { renderAt } from './helpers.jsx'
import { rule } from './css-helpers.js'

const cardNames = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent)
const search = () => screen.getByRole('searchbox', { name: /search devices/i })
const categories = new Set(devices.map((d) => d.category))

describe('012 hero and search', () => {
  it('shows a hero with a headline, a short text and two numbers', () => {
    renderAt('/')
    const hero = document.querySelector('.hero')
    expect(hero).toBeTruthy()
    expect(within(hero).getByRole('heading', { level: 1, name: /tech you need/i })).toBeInTheDocument()
    expect(hero.querySelector('.eyebrow')).toBeTruthy()
    expect(hero.querySelector('.lead')).toBeTruthy()

    const stats = [...hero.querySelectorAll('.stats li strong')].map((s) => s.textContent)
    expect(stats).toEqual([String(devices.length), String(categories.size)])
  })

  it('the search box finds devices by name, ignoring case', () => {
    renderAt('/')
    fireEvent.change(search(), { target: { value: 'MAC' } })
    const names = cardNames()
    expect(names.length).toBeGreaterThan(0)
    expect(names.every((n) => n.toLowerCase().includes('mac'))).toBe(true)
    expect(names).toHaveLength(devices.filter((d) => d.name.toLowerCase().includes('mac')).length)
  })

  it('the search works together with the category filter', () => {
    renderAt('/')
    fireEvent.change(search(), { target: { value: 'a' } })
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Laptop' } })
    const want = devices.filter((d) => d.category === 'Laptop' && d.name.toLowerCase().includes('a')).map((d) => d.name)
    expect(cardNames().sort()).toEqual(want.sort())
  })

  it('says so when nothing matches, and shows everything again when cleared', () => {
    renderAt('/')
    fireEvent.change(search(), { target: { value: 'zzzz' } })
    expect(screen.getByText('No devices found.')).toBeInTheDocument()
    fireEvent.change(search(), { target: { value: '' } })
    expect(cardNames()).toHaveLength(devices.length)
  })

  it('the hero is a gradient banner', () => {
    const hero = rule('.hero')
    expect(hero?.background).toContain('var(--gradient-brand)')
    expect(hero?.['border-radius']).toContain('var(--radius)')
    expect(hero?.color).toContain('var(--color-on-primary)')
    expect(hero?.['box-shadow']).toContain('var(--shadow-lg)')
    expect(rule('.hero .accent')?.color).toContain('var(--color-highlight)')
  })

  it('the search box is a big pill, and its label is hidden but readable by screen readers', () => {
    expect(rule('.search input')?.['border-radius']).toBe('999px')
    expect(rule('.search input')?.width).toBe('100%')
    const hidden = rule('.visually-hidden')
    expect(hidden?.position).toBe('absolute')
    expect(hidden?.width).toBe('1px')
    expect(hidden?.overflow).toBe('hidden')
  })

  it('the numbers are laid out in a row with large digits', () => {
    expect(rule('.stats')?.display).toBe('flex')
    expect(rule('.stats')?.['list-style']).toBe('none')
    expect(rule('.stats strong')?.['font-family']).toContain('var(--font-display)')
    expect(rule('.eyebrow')?.['text-transform']).toBe('uppercase')
  })
})
