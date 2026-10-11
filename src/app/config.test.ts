import { describe, expect, it } from 'vitest'
import { readFeatures } from './config'

describe('readFeatures', () => {
  it('keeps the capstone concept off unless it is explicitly enabled', () => {
    expect(readFeatures('')).toEqual({ capstone: false })
    expect(readFeatures('?test=1')).toEqual({ capstone: false })
    expect(readFeatures('?capstone=1')).toEqual({ capstone: true })
  })
})