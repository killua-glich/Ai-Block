// Bug fix for the damage task 001's agent run left behind (see backlog/todo/008).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { allRules, rule } from './css-helpers.js'

const css = readFileSync('src/index.css', 'utf8')
const rules = allRules().filter((r) => r.context === '')
const selectors = rules.map((r) => r.selector)

describe('008 fix 001 regressions', () => {
  it('button styles are back', () => {
    // values may use variables later, so only the properties are checked
    expect(Object.keys(rule('button') ?? {}).sort()).toEqual(expect.arrayContaining(['background', 'border', 'border-radius', 'color', 'cursor', 'padding']))
    expect(rule('button:disabled')?.cursor).toBe('not-allowed')
    expect(Object.keys(rule('button:disabled') ?? {})).toContain('background')
  })

  it('.filters is defined exactly once', () => {
    expect(selectors.filter((s) => s === '.filters')).toHaveLength(1)
  })

  it('no selector is defined twice', () => {
    const dupes = selectors.filter((s, i) => selectors.indexOf(s) !== i)
    expect(dupes).toEqual([])
  })

  it('index.css ends with a newline', () => {
    expect(css.endsWith('\n')).toBe(true)
  })

  it('task 001 file has its prompt back and all boxes ticked', () => {
    const md = readFileSync('backlog/done/001-category-filter.md', 'utf8')
    expect(md).toContain('## Prompt')
    expect(md).toContain('## Acceptance criteria')
    expect(md).not.toContain('- [ ]')
    expect(md).not.toMatch(/^EOF$/m)
  })
})
