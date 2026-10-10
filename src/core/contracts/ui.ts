import { z } from 'zod'
import { SeveritySchema, type InteractionEvent } from './events'
import { ErrorCategorySchema } from './ids'
import type { Locale } from './save'

/** Props every interaction-kit component receives. */
export interface InteractionProps<C> {
  config: C
  locale: Locale
  onEvent: (event: InteractionEvent) => void
  onComplete: () => void
}

/** A UI component for one interaction; returns a renderable (typed `unknown` to keep core React-free). */
export type InteractionComponent<C> = (props: InteractionProps<C>) => unknown

/** Schema for FormFiller config. */
export const FormFillerConfigSchema = z
  .object({
    titleKey: z.string(),
    fields: z
      .array(
        z
          .object({
            id: z.string(),
            labelKey: z.string(),
            options: z.array(z.object({ id: z.string(), labelKey: z.string() }).strict()).min(1),
            correctOptionId: z.string(),
            error: ErrorCategorySchema.optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
/** Config for the fictional account-opening form. */
export type FormFillerConfig = z.infer<typeof FormFillerConfigSchema>

/** Schema for DocumentInspector config. */
export const DocumentInspectorConfigSchema = z
  .object({
    titleKey: z.string(),
    promptKey: z.string(),
    fields: z
      .array(
        z
          .object({
            id: z.string(),
            labelKey: z.string(),
            valueKey: z.string(),
            isAnswer: z.boolean(),
            error: ErrorCategorySchema.optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict()
/** Config for inspecting a fictional document by tapping fields. */
export type DocumentInspectorConfig = z.infer<typeof DocumentInspectorConfigSchema>

const KeySchema = z.string().min(1).regex(/\S/)
const NonnegativePaiseSchema = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER)
const PositiveIntegerSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
const P1TextFields = {
  titleKey: KeySchema,
  promptKey: KeySchema,
  hintKeys: z.tuple([KeySchema, KeySchema]),
  explanationKey: KeySchema,
}
const ChoiceFeedbackFields = {
  error: ErrorCategorySchema.optional(),
  severity: SeveritySchema.optional(),
}
const hasCriticalSafetySeverity = (feedback: { error?: string; severity?: string }) =>
  !['upi.pin_to_receive', 'fraud.shared_otp'].includes(feedback.error ?? '') ||
  feedback.severity === 'critical'
const criticalSafetyFeedback = {
  path: ['severity'],
  message: 'PIN-to-receive and shared-OTP errors must be critical',
}

/** Fictional payment screen; entering a mock PIN is an action, never a stored value. */
export const UpiPaymentConfigSchema = z
  .object({
    ...P1TextFields,
    mode: z.enum(['pay', 'receive']),
    payeeNameKey: KeySchema,
    payeeHandleKey: KeySchema,
    amountPaise: PositiveIntegerSchema,
    noteKey: KeySchema,
    choices: z
      .array(
        z
          .object({
            id: KeySchema,
            labelKey: KeySchema,
            action: z.enum(['enterPin', 'decline']),
            ...ChoiceFeedbackFields,
          })
          .strict()
          .refine(hasCriticalSafetySeverity, criticalSafetyFeedback),
      )
      .min(2)
      .refine((choices) => new Set(choices.map((choice) => choice.id)).size === choices.length, {
        message: 'Choice IDs must be unique',
      }),
    correctChoiceId: KeySchema,
  })
  .strict()
  .refine((config) => config.choices.some((choice) => choice.id === config.correctChoiceId), {
    path: ['correctChoiceId'],
    message: 'Answer must reference a configured choice',
  })
  .refine(
    (config) =>
      config.choices.every(
        (choice) => choice.id === config.correctChoiceId || (choice.error && choice.severity),
      ),
    { path: ['choices'], message: 'Wrong choices need an error category and severity' },
  )
  .refine(
    (config) =>
      config.mode !== 'receive' ||
      config.choices.every(
        (choice) =>
          choice.action !== 'enterPin' ||
          (choice.id !== config.correctChoiceId &&
            choice.error === 'upi.pin_to_receive' &&
            choice.severity === 'critical'),
      ),
    { path: ['choices'], message: 'Entering a PIN to receive money must be a critical mistake' },
  )
export type UpiPaymentConfig = z.infer<typeof UpiPaymentConfigSchema>

/** Ordered fictional messages with selectable signs and per-message answer keys. */
export const MessageTriageConfigSchema = z
  .object({
    ...P1TextFields,
    messages: z
      .array(
        z
          .object({
            id: KeySchema,
            channel: z.enum(['sms', 'chat', 'call']),
            senderKey: KeySchema,
            bodyKey: KeySchema,
            correctClassification: z.enum(['safe', 'fraud']),
            warningSigns: z
              .array(z.object({ id: KeySchema, labelKey: KeySchema }).strict())
              .refine((signs) => new Set(signs.map((sign) => sign.id)).size === signs.length, {
                message: 'Warning sign IDs must be unique within a message',
              }),
            requiredWarningSignIds: z
              .array(KeySchema)
              .refine((ids) => new Set(ids).size === ids.length, {
                message: 'Required warning sign IDs must be unique',
              }),
            error: ErrorCategorySchema,
            severity: SeveritySchema,
          })
          .strict()
          .refine(hasCriticalSafetySeverity, criticalSafetyFeedback)
          .refine(
            (message) =>
              message.requiredWarningSignIds.every((id) =>
                message.warningSigns.some((sign) => sign.id === id),
              ),
            {
              path: ['requiredWarningSignIds'],
              message: 'Required warning signs must reference configured signs',
            },
          )
          .refine(
            (message) =>
              message.correctClassification !== 'fraud' ||
              message.requiredWarningSignIds.length > 0,
            {
              path: ['requiredWarningSignIds'],
              message: 'Fraud messages need at least one required warning sign',
            },
          ),
      )
      .min(1)
      .refine(
        (messages) => new Set(messages.map((message) => message.id)).size === messages.length,
        {
          message: 'Message IDs must be unique',
        },
      ),
  })
  .strict()
export type MessageTriageConfig = z.infer<typeof MessageTriageConfigSchema>

/** Loan inputs only: annualRatePct 12 means 12%; EMI and totals are derived by finance. */
export const OfferComparatorConfigSchema = z
  .object({
    ...P1TextFields,
    offers: z
      .array(
        z
          .object({
            id: KeySchema,
            labelKey: KeySchema,
            principalPaise: PositiveIntegerSchema,
            annualRatePct: z.number().finite().nonnegative(),
            tenureMonths: PositiveIntegerSchema,
            feesPaise: NonnegativePaiseSchema,
            assumptionsKey: KeySchema,
            ...ChoiceFeedbackFields,
          })
          .strict()
          .refine(hasCriticalSafetySeverity, criticalSafetyFeedback),
      )
      .min(2)
      .refine((offers) => new Set(offers.map((offer) => offer.id)).size === offers.length, {
        message: 'Offer IDs must be unique',
      }),
    correctOfferId: KeySchema,
    budget: z
      .object({
        incomePaise: NonnegativePaiseSchema,
        rentPaise: NonnegativePaiseSchema,
        essentialsPaise: NonnegativePaiseSchema,
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((config) => config.offers.some((offer) => offer.id === config.correctOfferId), {
    path: ['correctOfferId'],
    message: 'Answer must reference a configured offer',
  })
  .refine(
    (config) =>
      config.offers.every(
        (offer) => offer.id === config.correctOfferId || (offer.error && offer.severity),
      ),
    { path: ['offers'], message: 'Wrong offers need an error category and severity' },
  )
export type OfferComparatorConfig = z.infer<typeof OfferComparatorConfigSchema>

/** Registry of interaction components, keyed by interaction id. */
export interface InteractionRegistry {
  formFiller?: InteractionComponent<FormFillerConfig>
  documentInspector?: InteractionComponent<DocumentInspectorConfig>
  upiPayment?: InteractionComponent<UpiPaymentConfig>
  messageTriage?: InteractionComponent<MessageTriageConfig>
  offerComparator?: InteractionComponent<OfferComparatorConfig>
}
