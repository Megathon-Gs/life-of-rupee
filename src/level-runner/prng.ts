/** Seeded PRNG (mulberry32): the same seed always yields the same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Picks an index in `[0, n)` from the first draw of a seeded PRNG. */
export function pickIndex(seed: number, n: number): number {
  if (!Number.isInteger(n) || n < 1) throw new Error(`Cannot pick from ${n} items`)
  return Math.floor(mulberry32(seed)() * n)
}
