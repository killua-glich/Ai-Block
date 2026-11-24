import { readFileSync } from 'node:fs'
import { parseCss } from '../scripts/css.mjs'

export const cssText = () => readFileSync('src/index.css', 'utf8')
export const allRules = () => parseCss(cssText())

// The properties of a rule: top-level by default, or inside a media query whose
// text contains `context`. Several rules with the same selector are merged.
export function rule(selector, context = '') {
  const found = allRules().filter(r => r.selector === selector && (context === '' ? r.context === '' : r.context.includes(context)))
  return found.length === 0 ? undefined : Object.assign({}, ...found.map(r => r.decls))
}

// Every `#abc` colour written in a value, outside :root.
export function hexColoursOutsideRoot() {
  return allRules()
    .filter(r => r.selector !== ':root' && r.context === '')
    .flatMap(r => Object.entries(r.decls).filter(([, v]) => /#[0-9a-fA-F]{3,8}\b/.test(v)).map(([k]) => `${r.selector} { ${k} }`))
}
