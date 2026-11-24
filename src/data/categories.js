const ICONS = {
  Laptop: '💻',
  Tablet: '📲',
  Camera: '📷',
  Phone: '📱',
  Audio: '🎧',
  Gaming: '🎮',
  Drone: '🚁',
}

export function categoryIcon(category) {
  return ICONS[category] ?? '📦'
}

// A stable colour per category: the same name always gives the same hue.
// Only hues from 200 to 359 (blue to pink), so every card matches the violet brand.
export function categoryHue(category) {
  let sum = 0
  for (const ch of category) sum = (sum * 31 + ch.charCodeAt(0)) % 160
  return 200 + sum
}
