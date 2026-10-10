import { LevelDefSchema } from '@/core/contracts'

// P1-07 mistake path: in the decision, call the routine phone-shop notice 'fraud' (fraud.misclassified,
// minor), correct it to 'safe', then answer the transfer correctly. The one noncritical error earns 2
// stars; a clean run earns 3. Sharing an OTP/PIN or paying a fraud request is critical: corrected, it caps at 1 star.
const sign = (id: string, labelKey: string) => ({ id, labelKey: `l05:sign.${labelKey}` })
const urgency = sign('urgency', 'urgency')
const impersonation = sign('impersonation', 'impersonation')
const unknownLink = sign('unknown-link', 'link')
const otpPinRequest = sign('otp-pin-request', 'otpPin')
const prizeOffer = sign('prize-offer', 'prize')
const paymentRequest = sign('payment-request', 'payment')

const reviewed = { reviewerRole: 'NGO educator (user approval)', reviewedOn: '2026-10-10' }

export const level = LevelDefSchema.parse({
  id: 'l05-fraud-safety',
  skillNodes: ['safety.fraud'],
  location: 'phone-shop',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['l05:hook.1', 'l05:hook.2', 'l05:hook.3'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'messageTriage',
      config: {
        titleKey: 'l05:lesson.title',
        promptKey: 'l05:lesson.prompt',
        hintKeys: ['l05:lesson.hint1', 'l05:lesson.hint2'],
        explanationKey: 'l05:lesson.explanation',
        messages: [
          {
            id: 'lesson-account-block', channel: 'sms',
            senderKey: 'l05:lesson.urgent.sender', bodyKey: 'l05:lesson.urgent.body',
            correctClassification: 'fraud',
            warningSigns: [urgency, impersonation, unknownLink],
            requiredWarningSignIds: ['urgency', 'unknown-link'],
            error: 'fraud.clicked_link', severity: 'major',
          },
          {
            id: 'lesson-library-notice', channel: 'chat',
            senderKey: 'l05:lesson.routine.sender', bodyKey: 'l05:lesson.routine.body',
            correctClassification: 'safe',
            warningSigns: [], requiredWarningSignIds: [],
            error: 'fraud.misclassified', severity: 'minor',
          },
        ],
      },
    },
    { id: 'travel', type: 'travel', location: 'phone-shop' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'messageTriage',
      config: {
        titleKey: 'l05:decision.title',
        promptKey: 'l05:decision.prompt',
        hintKeys: ['l05:decision.hint1', 'l05:decision.hint2'],
        explanationKey: 'l05:decision.explanation',
        messages: [
          {
            id: 'otp-request', channel: 'sms',
            senderKey: 'l05:decision.otp.sender', bodyKey: 'l05:decision.otp.body',
            correctClassification: 'fraud',
            warningSigns: [urgency, impersonation, otpPinRequest],
            requiredWarningSignIds: ['urgency', 'otp-pin-request'],
            error: 'fraud.shared_otp', severity: 'critical',
          },
          {
            id: 'prize-fee', channel: 'chat',
            senderKey: 'l05:decision.prize.sender', bodyKey: 'l05:decision.prize.body',
            correctClassification: 'fraud',
            warningSigns: [urgency, prizeOffer, paymentRequest],
            requiredWarningSignIds: ['prize-offer', 'payment-request'],
            error: 'fraud.paid_request', severity: 'critical',
          },
          {
            id: 'parcel-link', channel: 'sms',
            senderKey: 'l05:decision.link.sender', bodyKey: 'l05:decision.link.body',
            correctClassification: 'fraud',
            warningSigns: [urgency, impersonation, unknownLink],
            requiredWarningSignIds: ['urgency', 'unknown-link'],
            error: 'fraud.clicked_link', severity: 'major',
          },
          {
            id: 'repair-ready', channel: 'chat',
            senderKey: 'l05:decision.safe.sender', bodyKey: 'l05:decision.safe.body',
            correctClassification: 'safe',
            warningSigns: [], requiredWarningSignIds: [],
            error: 'fraud.misclassified', severity: 'minor',
          },
        ],
      },
      rubric: {
        penaltyWeights: { minor: 1, major: 2, hint1: 0.5, hint2: 1 },
        twoStarMaxPenalty: 2,
        criticalCap: 1,
        transferCap: 2,
        decisionStepId: 'decision',
        transferStepId: 'transfer',
      },
    },
    { id: 'consequence', type: 'consequence', outcomeKeys: ['l05:consequence.stopped'], explanationKey: 'l05:consequence.explanation' },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'power-cut-urgency', interaction: 'messageTriage',
          config: {
            titleKey: 'l05:transfer.power.title',
            promptKey: 'l05:transfer.power.prompt',
            hintKeys: ['l05:transfer.power.hint1', 'l05:transfer.power.hint2'],
            explanationKey: 'l05:transfer.power.explanation',
            messages: [
              {
                id: 'power-notice', channel: 'sms',
                senderKey: 'l05:transfer.power.urgent.sender', bodyKey: 'l05:transfer.power.urgent.body',
                correctClassification: 'fraud',
                warningSigns: [urgency, impersonation, unknownLink],
                requiredWarningSignIds: ['urgency', 'unknown-link'],
                error: 'fraud.clicked_link', severity: 'major',
              },
              {
                id: 'class-notice', channel: 'chat',
                senderKey: 'l05:transfer.power.routine.sender', bodyKey: 'l05:transfer.power.routine.body',
                correctClassification: 'safe',
                warningSigns: [], requiredWarningSignIds: [],
                error: 'fraud.misclassified', severity: 'minor',
              },
            ],
          },
        },
        {
          id: 'lucky-winner-request', interaction: 'messageTriage',
          config: {
            titleKey: 'l05:transfer.lucky.title',
            promptKey: 'l05:transfer.lucky.prompt',
            hintKeys: ['l05:transfer.lucky.hint1', 'l05:transfer.lucky.hint2'],
            explanationKey: 'l05:transfer.lucky.explanation',
            messages: [
              {
                id: 'club-notice', channel: 'chat',
                senderKey: 'l05:transfer.lucky.routine.sender', bodyKey: 'l05:transfer.lucky.routine.body',
                correctClassification: 'safe',
                warningSigns: [], requiredWarningSignIds: [],
                error: 'fraud.misclassified', severity: 'minor',
              },
              {
                id: 'voucher-request', channel: 'sms',
                senderKey: 'l05:transfer.lucky.request.sender', bodyKey: 'l05:transfer.lucky.request.body',
                correctClassification: 'fraud',
                warningSigns: [prizeOffer, paymentRequest],
                requiredWarningSignIds: ['prize-offer', 'payment-request'],
                error: 'fraud.paid_request', severity: 'critical',
              },
            ],
          },
        },
      ],
    },
  ],
  worldEffects: [{ key: 'fraud.seenWarningSigns', value: 'true' }],
  claims: [
    { textKey: 'l05:claim.otpPin', sourceIds: ['rbi-kyc-fraud-leaflet', 'rbi-cyber-threats-advisory'], ...reviewed },
    { textKey: 'l05:claim.urgency', sourceIds: ['rbi-kyc-fraud-leaflet', 'rbi-cyber-threats-advisory'], ...reviewed },
    { textKey: 'l05:claim.links', sourceIds: ['rbi-kyc-fraud-leaflet'], ...reviewed },
    { textKey: 'l05:claim.impersonation', sourceIds: ['rbi-cyber-threats-advisory', 'rbi-fictitious-offers'], ...reviewed },
    { textKey: 'l05:claim.prizes', sourceIds: ['rbi-fictitious-offers', 'npci-fraud-awareness'], ...reviewed },
    { textKey: 'l05:claim.report', sourceIds: ['rbi-kyc-fraud-leaflet', 'ncrp-complaint-portal', 'rbi-cyber-threats-advisory'], ...reviewed },
    { textKey: 'l05:lesson.explanation', sourceIds: ['rbi-kyc-fraud-leaflet', 'rbi-cyber-threats-advisory'], ...reviewed },
    { textKey: 'l05:decision.explanation', sourceIds: ['rbi-kyc-fraud-leaflet', 'rbi-fictitious-offers'], ...reviewed },
    { textKey: 'l05:consequence.explanation', sourceIds: ['rbi-kyc-fraud-leaflet', 'ncrp-complaint-portal', 'rbi-cyber-threats-advisory'], ...reviewed },
    { textKey: 'l05:transfer.power.explanation', sourceIds: ['rbi-kyc-fraud-leaflet'], ...reviewed },
    { textKey: 'l05:transfer.lucky.explanation', sourceIds: ['rbi-fictitious-offers', 'npci-fraud-awareness'], ...reviewed },
    { textKey: 'l05:fraud.shared_otp.review', sourceIds: ['rbi-kyc-fraud-leaflet', 'rbi-cyber-threats-advisory'], ...reviewed },
    { textKey: 'l05:fraud.paid_request.review', sourceIds: ['rbi-fictitious-offers', 'npci-fraud-awareness'], ...reviewed },
    { textKey: 'l05:fraud.clicked_link.review', sourceIds: ['rbi-kyc-fraud-leaflet'], ...reviewed },
    { textKey: 'l05:fraud.misclassified.review', sourceIds: ['rbi-kyc-fraud-leaflet'], ...reviewed },
  ],
})
