import { forest, sage } from '@mind-court/ui'

const AVATAR_COLORS = [
  forest[500], forest[600],
  '#6B8CAE', '#7A8E70', '#A0845C', '#7A6B8A',
  sage[700],
]

export function avatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
