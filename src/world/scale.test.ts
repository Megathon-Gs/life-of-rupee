import { describe, expect, it } from 'vitest'
import { bandHeight, logicalWidth, scaleFor, stageOffsetY } from './scale'

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
  it('leaves the integer-scale remainder as sky above a bottom-anchored stage', () => {
    expect(stageOffsetY(1332, 4)).toBe(252)
    expect(stageOffsetY(900, 3)).toBe(90)
    expect(stageOffsetY(270, 1)).toBe(0)
  })

  it('never goes negative for a band shorter than the stage', () => {
    expect(stageOffsetY(100, 1)).toBe(0)
  })
})
