/**
 * A star drawn on a 13×13 pixel grid as crisp SVG rects, so it scales by whole
 * numbers and matches the world's pixel language. Decorative: callers carry the
 * accessible text.
 */
const STAR_ROWS = [
  '......#......',
  '.....###.....',
  '.....###.....',
  '....#####....',
  '#############',
  '.###########.',
  '..#########..',
  '...#######...',
  '...#######...',
  '..####.####..',
  '..###...###..',
  '.###.....###.',
  '.##.......##.',
]

const SIZE = STAR_ROWS.length
const inside = (x: number, y: number) => STAR_ROWS[y]?.[x] === '#'

type Cell = { x: number; y: number }
const edge: Cell[] = []
const body: Cell[] = []
const shade: Cell[] = []
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    if (!inside(x, y)) continue
    const isEdge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)
    if (isEdge) edge.push({ x, y })
    else if (y >= 7 || x >= 8) shade.push({ x, y })
    else body.push({ x, y })
  }
}

export type PixelStarState = 'earned' | 'empty' | 'lost'

export interface PixelStarProps {
  state: PixelStarState
  /** Whole-number multiple of the 13 px grid. */
  scale?: number
  className?: string
}

const FILL: Record<PixelStarState, { body: string; shade: string }> = {
  earned: { body: 'var(--color-star)', shade: 'var(--color-star-edge)' },
  empty: { body: 'var(--color-star-empty)', shade: 'var(--color-star-empty)' },
  lost: { body: 'var(--color-loss-soft)', shade: 'var(--color-loss-soft)' },
}

export function PixelStar({ state, scale = 4, className }: PixelStarProps) {
  const side = SIZE * Math.max(1, Math.round(scale))
  const fill = FILL[state]
  return (
    <svg
      className={className}
      width={side}
      height={side}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      data-star-state={state}
    >
      {body.map(({ x, y }) => (
        <rect key={`b${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill.body} />
      ))}
      {shade.map(({ x, y }) => (
        <rect key={`s${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill.shade} />
      ))}
      {edge.map(({ x, y }) => (
        <rect
          key={`e${x}-${y}`}
          x={x}
          y={y}
          width={1}
          height={1}
          fill={state === 'lost' ? 'var(--color-loss)' : 'var(--color-edge)'}
        />
      ))}
    </svg>
  )
}
