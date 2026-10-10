import type { Locale, ReviewItem, SkillNodeId } from '@/core/contracts'
import type { UiSettings } from '../shell/UiRoot'

/**
 * Gallery fixtures. Lesson text comes from the approved l02/world namespaces;
 * the few lines below exist only to exercise layout (dev-only, never shipped).
 */
export const FIXTURE_TEXT: Record<Locale, { chapter: string; speaker: string; lines: string[] }> = {
  en: {
    chapter: 'Chapter 1: Your first account',
    speaker: 'Bank staff',
    lines: [
      'Welcome. You want to open your first savings account?',
      'You are under 18, so a minor account has its own rules.',
      "Let's check which documents the bank can accept.",
    ],
  },
  te: {
    chapter: 'అధ్యాయం 1: మీ మొదటి ఖాతా',
    speaker: 'బ్యాంకు సిబ్బంది',
    lines: [
      'స్వాగతం. మీ మొదటి పొదుపు ఖాతా తెరవాలనుకుంటున్నారా?',
      'మీకు 18 ఏళ్లు నిండలేదు, కాబట్టి మైనర్ ఖాతాకు వేరే నియమాలు ఉంటాయి.',
      'బ్యాంకు ఏ పత్రాలను అంగీకరించగలదో చూద్దాం.',
    ],
  },
}

export const fixtureSettings = (locale: Locale, reducedMotion: UiSettings['reducedMotion']): UiSettings => ({
  locale,
  reducedMotion,
  muted: false,
  textScale: 1,
})

/** A two-star attempt: one important KYC mistake. */
export const FIXTURE_REVIEW: ReviewItem[] = [
  {
    error: 'kyc.wrong_document',
    severity: 'major',
    skillNode: 'access.identity' as SkillNodeId,
    reviewKey: 'kyc.wrong_document.review',
  },
]

export const FIXTURE_COMPLETED = ['money.budgeting', 'access.identity'] as SkillNodeId[]
export const FIXTURE_JUST_LIT = 'access.identity' as SkillNodeId
