export type CapstoneBranding = 'neutral' | 'approved'

/** Anything other than the exact value "approved" stays neutral. */
export function parseCapstoneBranding(value: unknown): CapstoneBranding {
  return value === 'approved' ? 'approved' : 'neutral'
}

/** Build-time switch: VITE_CAPSTONE_BRANDING=approved, only after the partner approves branding. */
export const capstoneBranding: CapstoneBranding = parseCapstoneBranding(
  import.meta.env.VITE_CAPSTONE_BRANDING,
)

/** Atlas frame names in the urban district for the capstone centre. */
export function capstoneFrames(branding: CapstoneBranding = capstoneBranding) {
  const prefix = branding === 'approved' ? 'capstone-centre-branded' : 'capstone-centre'
  return { lit: `${prefix}-lit`, unlit: `${prefix}-unlit` } as const
}
