import { describe, expect, it } from 'vitest'
import { bandHeight, fitScale, logicalWidth, scaleFor, stageExtents, stageOffsetY } from './scale'

describe('scaleFor', () => {
  it('floors the band height to whole multiples of 270', () => {
    expect(scaleFor(1519)).toBe(5)
    expect(scaleFor(1080)).toBe(4)
    expect(scaleFor(200)).toBe(1)
  })

  it('never drops below 1 for tiny bands', () => {
    expect(scaleFor(0)).toBe(1)
    expect(scaleFor(269)).toBe(1)
  })
})

describe('logicalWidth', () => {
  it('divides the device width by the integer factor', () => {
    expect(logicalWidth(1170, 5)).toBe(234)
    expect(logicalWidth(1440, 4)).toBe(360)
  })
})

describe('bandHeight', () => {
  it('uses the full height in landscape', () => {
    expect(bandHeight({ width: 1440, height: 900 })).toBe(900)
  })

  it('uses 60% of the height in portrait', () => {
    expect(bandHeight({ width: 360, height: 740 })).toBe(444)
  })
})

describe('stageOffsetY', () => {
  it('puts the ground line near 80% of a tall viewport, above the bottom controls', () => {
    // 1350 px stage in 2220: bottom-pinned would be 870; the ground-line rule gives 726.
    expect(stageOffsetY(2220, 5)).toBe(726)
    expect(stageOffsetY(2402, 5)).toBe(872)
  })

  it('stays bottom-pinned when that is already higher (landscape)', () => {
    expect(stageOffsetY(900, 3)).toBe(90)
    expect(stageOffsetY(270, 1)).toBe(0)
  })

  it('never goes negative for a viewport shorter than the stage', () => {
    expect(stageOffsetY(100, 1)).toBe(0)
  })
})

describe('stageExtents', () => {
  it('reports the whole rows of sky above and road below', () => {
    expect(stageExtents(2220, 5)).toEqual({ top: 146, bottom: 29 })
    expect(stageExtents(900, 3)).toEqual({ top: 30, bottom: 0 })
  })
})

describe('fitScale', () => {
  it('fits the full height in landscape', () => {
    expect(fitScale({ width: 1440, height: 900 })).toBe(3)
  })

  it('fills more of a portrait phone but keeps about two buildings across', () => {
    expect(fitScale({ width: 1080, height: 2220 })).toBe(5)
    expect(fitScale({ width: 1082, height: 2402 })).toBe(5)
    expect(fitScale({ width: 720, height: 1480 })).toBe(3)
    expect(fitScale({ width: 360, height: 740 })).toBe(1)
  })
})
