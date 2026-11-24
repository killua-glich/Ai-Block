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
        const bad = []
        for (const part of buf.split(';')) {
          const i = part.indexOf(':')
          if (i < 0) {
            if (part.trim()) bad.push(part.trim().replace(/\s+/g, ' '))
            continue
          }
          const prop = part.slice(0, i).trim().toLowerCase()
          if (prop) decls[prop] = part.slice(i + 1).trim().replace(/\s+/g, ' ')
        }
        rules.push({ context: top.context, selector: top.head, decls, bad })
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

// Typos that make the browser silently ignore a declaration. Returns plain sentences.
//   " * color: red"      -> property name is not a valid name
//   "color var(--x)"     -> declaration without a colon
//   "color:"             -> declaration without a value
//   a missing or extra } -> unbalanced braces
const PROPERTY_NAME = /^(--[a-z0-9_-]+|-{0,2}[a-z][a-z0-9-]*)$/i

export function lintCss(text) {
  const problems = []
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '')
  const open = (stripped.match(/{/g) ?? []).length
  const close = (stripped.match(/}/g) ?? []).length
  if (open !== close) problems.push(`unbalanced braces: ${open} "{" and ${close} "}"`)
  for (const r of parseCss(text)) {
    const where = (r.context ? `${r.context} > ` : '') + r.selector
    for (const [prop, value] of Object.entries(r.decls)) {
      if (!PROPERTY_NAME.test(prop)) problems.push(`${where}: "${prop}: ${value}" is not a valid property name`)
      else if (value === '') problems.push(`${where}: "${prop}" has no value`)
    }
    for (const part of r.bad) problems.push(`${where}: "${part}" has no colon`)
  }
  return problems
}
