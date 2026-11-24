// Styling: device photos on the cards and on the detail page, with the emoji and gradient as fallback.
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { renderAt } from './helpers.jsx'
import devices from '../src/data/devices.js'
import { rule } from './css-helpers.js'

describe('021 device photos', () => {
  it('there is a photo file for every device', () => {
    for (const d of devices) {
      expect(existsSync(`public/devices/${d.id}.jpg`), `public/devices/${d.id}.jpg`).toBe(true)
    }
  })

  it('every card shows its photo after the icon, which stays as a fallback', () => {
    renderAt('/')
    const cards = document.querySelectorAll('article.card')
    expect(cards.length).toBe(devices.length)
    cards.forEach((card) => {
      const id = card.querySelector('a.view-link').getAttribute('href').split('/').pop()
      const media = card.querySelector('.card-media')
      const photo = media.querySelector('img.card-photo')
      expect(photo).toBeTruthy()
      expect(photo).toHaveAttribute('src', `/devices/${id}.jpg`)
      expect(photo).toHaveAttribute('alt', '')
      expect(photo).toHaveAttribute('loading', 'lazy')
      expect(media.querySelector('.card-icon')).toBeTruthy()
      expect(media.lastElementChild).toBe(photo)
    })
  })

  it('the detail page shows the photo after the icon', () => {
    renderAt('/devices/3')
    const media = document.querySelector('.detail-media')
    const photo = media.querySelector('img.detail-photo')
    expect(photo).toBeTruthy()
    expect(photo).toHaveAttribute('src', '/devices/3.jpg')
    expect(photo).toHaveAttribute('alt', '')
    expect(media.querySelector('.detail-icon')).toBeTruthy()
    expect(media.lastElementChild).toBe(photo)
  })

  it('the media boxes clip their photo', () => {
    for (const selector of ['.card-media', '.detail-media']) {
      expect(rule(selector)?.position, selector).toBe('relative')
      expect(rule(selector)?.overflow, selector).toBe('hidden')
    }
  })

  it('the photos fill their box', () => {
    for (const selector of ['.card-photo', '.detail-photo']) {
      const photo = rule(selector)
      expect(photo?.position, selector).toBe('absolute')
      expect(photo?.inset, selector).toBe('0')
      expect(photo?.width, selector).toBe('100%')
      expect(photo?.height, selector).toBe('100%')
      expect(photo?.['object-fit'], selector).toBe('cover')
    }
  })

  it('the card photo zooms a little on hover', () => {
    expect(rule('.card-photo')?.transition).toContain('transform')
    expect(rule('.card:hover .card-photo')?.transform).toContain('scale(')
  })
})
