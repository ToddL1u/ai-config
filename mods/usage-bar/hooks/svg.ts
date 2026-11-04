import type { Icon, Pill } from './pills'

const HEIGHT = 30
const PAD_X = 10
const ICON = 14
const FONT = 12
/** Advance of one monospace glyph at FONT px, for laying text out without measuring it. */
const CHAR = 7.3
const BAR = 64
const TEXT_Y = 19.5

/** Lucide-style strokes in a 24×24 box. */
const ICONS: Record<Icon, string> = {
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  layers: '<path d="m12 2-10 5 10 5 10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  coin: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>',
  branch: '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const textWidth = (s: string) => s.length * CHAR

function icon(name: Icon, x: number, color: string): string {
  const y = (HEIGHT - ICON) / 2

  return (
    `<svg x="${x}" y="${y}" width="${ICON}" height="${ICON}" viewBox="0 0 24 24" fill="none" ` +
    `stroke="${color}" color="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
  )
}

const text = (x: number, s: string, cls: string, color?: string) =>
  `<text x="${x}" y="${TEXT_Y}" class="${cls}"${color ? ` fill="${color}"` : ''}>${escape(s)}</text>`

/** The pill's inside, left to right from `x`; returns the markup and where it ended. */
function body(pill: Pill, start: number): { parts: string[]; end: number } {
  const parts: string[] = []
  let x = start
  parts.push(icon(pill.icon, x, pill.color))
  x += ICON + 6

  if (pill.kind === 'stat') {
    parts.push(text(x, pill.value, 'v'))
    return { parts, end: x + textWidth(pill.value) }
  }
  if (pill.kind === 'note') {
    parts.push(text(x, pill.text, 'm'))
    return { parts, end: x + textWidth(pill.text) }
  }

  parts.push(text(x, pill.label, 'm'))
  x += textWidth(pill.label) + 8

  const barY = HEIGHT / 2 - 2
  const fill = (Math.min(100, Math.max(0, pill.percent)) / 100) * BAR
  parts.push(`<rect x="${x}" y="${barY}" width="${BAR}" height="4" rx="2" fill="${pill.color}" fill-opacity="0.22"/>`)
  parts.push(`<rect x="${x}" y="${barY}" width="${fill.toFixed(1)}" height="4" rx="2" fill="${pill.tone}"/>`)
  if (pill.pace !== null) {
    const px = x + (pill.pace / 100) * BAR
    parts.push(`<rect x="${(px - 1).toFixed(1)}" y="${barY - 5}" width="2" height="14" rx="1" class="pace"/>`)
  }
  x += BAR + 10

  const percent = `${Math.round(pill.percent)}%`
  parts.push(text(x, percent, 'v', pill.tone === pill.color ? undefined : pill.tone))
  x += textWidth(percent)

  if (pill.detail !== null) {
    x += 9
    parts.push(`<path d="M${x} 9v12" stroke="${pill.color}" stroke-opacity="0.45"/>`)
    x += 9
    if (pill.hasClock) {
      parts.push(icon('clock', x, pill.color))
      x += ICON + 5
    }
    parts.push(text(x, pill.detail, 'm'))
    x += textWidth(pill.detail)
  }

  return { parts, end: x }
}

/** One pill as a standalone SVG document, sized to its content. */
export function pillSvg(pill: Pill): { source: string; width: number; height: number } {
  const { parts, end } = body(pill, PAD_X + 1)
  const width = Math.ceil(end + PAD_X + 1)
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" viewBox="0 0 ${width} ${HEIGHT}">` +
    '<style>' +
    `text{font:${FONT}px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}` +
    '.v{fill:#f3f4f6;font-weight:700}.m{fill:#9ca3af}.pace{fill:#f9fafb}' +
    '@media (prefers-color-scheme:light){.v{fill:#111827}.m{fill:#6b7280}.pace{fill:#111827}}' +
    '</style>' +
    `<rect x="0.5" y="0.5" width="${width - 1}" height="${HEIGHT - 1}" rx="${(HEIGHT - 1) / 2}" ` +
    `fill="${pill.color}" fill-opacity="0.13" stroke="${pill.color}" stroke-opacity="0.55"/>` +
    parts.join('') +
    '</svg>'

  return { source, width, height: HEIGHT }
}

/** What a reader without the drawing is told. */
export function pillAlt(pill: Pill): string {
  if (pill.kind === 'stat') return `${pill.key} ${pill.value}`
  if (pill.kind === 'note') return pill.text

  return `${pill.label} ${Math.round(pill.percent)}%${pill.detail === null ? '' : `, ${pill.hasClock ? 'resets in ' : ''}${pill.detail}`}`
}
