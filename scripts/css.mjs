// A small CSS reader shared by scripts/verify.mjs and the tests in tests/.
// It understands rules, comments and nested at-rules (@media, @supports, ...), nothing more.
//
// parseCss(text) -> [{ context, selector, decls }]
//   context  '' for a top-level rule, '@media (max-width: 600px)' inside a media query
//   selector as written, spaces squeezed, quotes normalised to "
//   decls    { property: value }, values with spaces squeezed

const CONTAINERS = /^@(media|supports|layer|container|keyframes|-webkit-keyframes)\b/

export function parseCss(text) {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  const stack = []
  let buf = ''
  for (const ch of src) {
    if (ch === '{') {
      const head = buf.trim().replace(/\s+/g, ' ').replace(/'/g, '"')
      buf = ''
      const context = stack.filter(s => s.isContainer).map(s => s.head).join(' > ')
      stack.push({ head, context, isContainer: CONTAINERS.test(head) })
    } else if (ch === '}') {
      const top = stack.pop()
      if (top && !top.isContainer) {
        const decls = {}
        for (const part of buf.split(';')) {
          const i = part.indexOf(':')
          if (i < 0) continue
          const prop = part.slice(0, i).trim().toLowerCase()
          if (prop) decls[prop] = part.slice(i + 1).trim().replace(/\s+/g, ' ')
        }
        rules.push({ context: top.context, selector: top.head, decls })
      }
      buf = ''
    } else {
      buf += ch
    }
  }
  return rules
}

// "@media (max-width: 600px) > .header" style keys: where a rule lives and what it is.
export function ruleKeys(text) {
  return parseCss(text).map(r => (r.context ? `${r.context} > ` : '') + r.selector)
}
