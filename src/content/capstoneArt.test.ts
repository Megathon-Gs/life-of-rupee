import { describe, expect, it } from 'vitest'
import manifest from '../../public/assets/manifest.json'
import { capstoneBranding, capstoneFrames, parseCapstoneBranding } from './capstoneArt'

describe('capstone art switch', () => {
  it('defaults to neutral and accepts only the exact approved value', () => {
    expect(capstoneBranding).toBe('neutral')
    expect(parseCapstoneBranding(undefined)).toBe('neutral')
    expect(parseCapstoneBranding('true')).toBe('neutral')
    expect(parseCapstoneBranding('approved')).toBe('approved')
  })

  it('maps each mode to frames that exist in the urban atlas', () => {
    const frames = manifest.districts.urban.frames as Record<string, unknown>
    expect(capstoneFrames('neutral')).toEqual({ lit: 'capstone-centre-lit', unlit: 'capstone-centre-unlit' })
    expect(capstoneFrames('approved')).toEqual({
      lit: 'capstone-centre-branded-lit',
      unlit: 'capstone-centre-branded-unlit',
    })
    for (const mode of ['neutral', 'approved'] as const) {
      for (const name of Object.values(capstoneFrames(mode))) expect(frames[name]).toBeTruthy()
    }
  })
})
