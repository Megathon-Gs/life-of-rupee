import { describe, expect, it } from 'vitest'
import { toRendererVisuals } from './visuals'

describe('toRendererVisuals', () => {
  it('moves the bank teller slot onto the bank building', () => {
    expect(toRendererVisuals({ bankTeller: 'greets' })).toEqual({ bank: 'greets' })
  })

  it('drops default variants so buildings keep their district colour', () => {
    expect(toRendererVisuals({ bankTeller: 'default' })).toEqual({})
  })

  it('passes unknown slots through as location ids', () => {
    expect(toRendererVisuals({ kirana: 'busy' })).toEqual({ kirana: 'busy' })
  })
})
