import { z } from 'zod'
import type { InteractionEvent } from './events'
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

/** Registry of interaction components, keyed by interaction id. */
export interface InteractionRegistry {
  formFiller?: InteractionComponent<FormFillerConfig>
  documentInspector?: InteractionComponent<DocumentInspectorConfig>
}
