// @vitest-environment node
// Accounts: password hashing with scrypt from Node, no package needed.
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../server/passwords.js'

describe('035 passwords', () => {
  it('stores scrypt$salt$hash and never the password itself', () => {
    const stored = hashPassword('correct horse battery')
    expect(stored).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
    expect(stored).not.toContain('correct')
  })

  it('the same password gives a different text every time (random salt)', () => {
    expect(hashPassword('same password')).not.toBe(hashPassword('same password'))
  })

  it('accepts the right password, also when it has spaces, accents or emoji', () => {
    for (const password of ['correct horse battery', '  spaced  ', 'Grüße aus Wien ☕', 'a'.repeat(150)]) {
      expect(verifyPassword(password, hashPassword(password)), password).toBe(true)
    }
  })

  it('refuses a wrong password, also one that only differs in case or by a space', () => {
    const stored = hashPassword('Correct Horse')
    for (const wrong of ['correct horse', 'Correct Horse ', 'Correct', '', 'wrong']) {
      expect(verifyPassword(wrong, stored), JSON.stringify(wrong)).toBe(false)
    }
  })

  it('refuses stored text that is broken or from somewhere else, without throwing', () => {
    for (const stored of ['', 'plain', 'scrypt$', 'scrypt$ab$', 'scrypt$$cd', 'bcrypt$ab$cd', null, undefined, 42]) {
      expect(verifyPassword('anything', stored), String(stored)).toBe(false)
    }
  })

  it('refuses a password that is not text', () => {
    const stored = hashPassword('secret password')
    for (const bad of [undefined, null, 12345678, {}, ['secret password']]) {
      expect(verifyPassword(bad, stored)).toBe(false)
    }
  })
})
