// Bug fix for the damage task 001's agent run left behind (see backlog/todo/008).
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/index.css', 'utf8')
const selectors = [...css.matchAll(/^\s*([^{}\n]+?)\s*\{/gm)].map((m) => m[1].trim())

describe('008 fix 001 regressions', () => {
  it('button styles are back', () => {
    expect(css).toContain('button { padding: 0.5rem 1rem; border-radius: 6px; border: none; background: #2563eb; color: #fff; cursor: pointer; }')
    expect(css).toContain('button:disabled { background: #9ca3af; cursor: not-allowed; }')
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
