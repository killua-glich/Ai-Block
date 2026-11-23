// Bug fix for the damage task 001's agent run left behind (see backlog/todo/008).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/index.css', 'utf8')
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
  selector: m[1].trim(),
  decls: m[2].split(';').map((d) => d.trim()).filter(Boolean).sort(),
}))
const selectors = rules.map((r) => r.selector)
const declsOf = (sel) => rules.find((r) => r.selector === sel)?.decls

describe('008 fix 001 regressions', () => {
  it('button styles are back', () => {
    expect(declsOf('button')).toEqual(['background: #2563eb', 'border-radius: 6px', 'border: none', 'color: #fff', 'cursor: pointer', 'padding: 0.5rem 1rem'].sort())
    expect(declsOf('button:disabled')).toEqual(['background: #9ca3af', 'cursor: not-allowed'].sort())
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
