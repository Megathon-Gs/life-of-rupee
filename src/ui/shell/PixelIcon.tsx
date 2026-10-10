/**
 * Small pixel icons drawn as crisp SVG rects on a 9×9 grid (no icon pack).
 * Always decorative; the control that holds one carries the accessible name.
 */
const ICONS = {
  previous: ['.....#...', '....##...', '...###...', '..#######', '.########', '..#######', '...###...', '....##...', '.....#...'],
  next: ['...#.....', '...##....', '...###...', '#######..', '########.', '#######..', '...###...', '...##....', '...#.....'],
  close: ['##.....##', '###...###', '.###.###.', '..#####..', '...###...', '..#####..', '.###.###.', '###...###', '##.....##'],
  settings: ['...#.#...', '.#######.', '.##...##.', '##.....##', '.#.....#.', '##.....##', '.##...##.', '.#######.', '...#.#...'],
  check: ['.........', '........#', '.......##', '......##.', '#....##..', '##..##...', '.####....', '..##.....', '.........'],
  lock: ['..#####..', '.##...##.', '.#.....#.', '#########', '####.####', '###...###', '####.####', '#########', '.........'],
} as const

export type PixelIconName = keyof typeof ICONS

const CELLS: Record<PixelIconName, Array<[number, number]>> = Object.fromEntries(
  Object.entries(ICONS).map(([name, rows]) => [
    name,
    rows.flatMap((row, y) => [...row].flatMap((ch, x) => (ch === '#' ? [[x, y] as [number, number]] : []))),
  ]),
) as Record<PixelIconName, Array<[number, number]>>

export interface PixelIconProps {
  name: PixelIconName
  /** Whole-number multiple of the 9 px grid. */
  scale?: number
  className?: string
}

export function PixelIcon({ name, scale = 2, className }: PixelIconProps) {
  const side = 9 * Math.max(1, Math.round(scale))
  return (
    <svg
      className={className}
      width={side}
      height={side}
      viewBox="0 0 9 9"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      {CELLS[name].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
      ))}
    </svg>
  )
}
