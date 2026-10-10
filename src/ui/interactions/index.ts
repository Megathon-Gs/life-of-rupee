import type { InteractionRegistry } from '@/core/contracts'
import { DocumentInspector } from './DocumentInspector/DocumentInspector'
import { FormFiller } from './FormFiller/FormFiller'

export { DocumentInspector } from './DocumentInspector/DocumentInspector'
export { FormFiller } from './FormFiller/FormFiller'

export const interactions: InteractionRegistry = {
  formFiller: FormFiller,
  documentInspector: DocumentInspector,
}
