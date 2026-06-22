export const DISPLAY_THEMES = ['gold', 'aurora', 'rose', 'jade', 'violet', 'amber'] as const
export type DisplayTheme = typeof DISPLAY_THEMES[number]

export interface ThemeInfo {
  id: DisplayTheme
  name: string
  accent: string
}

export const THEME_LIST: ThemeInfo[] = [
  { id: 'gold', name: '黑金', accent: '#d4a853' },
  { id: 'aurora', name: '极光', accent: '#7c9bff' },
  { id: 'rose', name: '绯红', accent: '#e3262e' },
  { id: 'jade', name: '翠玉', accent: '#5fd4a8' },
  { id: 'violet', name: '紫霄', accent: '#a78bff' },
  { id: 'amber', name: '琥珀', accent: '#ffb04a' },
]

export const DEFAULT_THEME: DisplayTheme = 'gold'

export function isValidTheme(value: unknown): value is DisplayTheme {
  return typeof value === 'string' && DISPLAY_THEMES.includes(value as DisplayTheme)
}
