import type { InteractionRegistry } from '@/core/contracts'
import { DocumentInspector } from './DocumentInspector/DocumentInspector'
import { FormFiller } from './FormFiller/FormFiller'
import { MessageTriage } from './MessageTriage/MessageTriage'
import { OfferComparator } from './OfferComparator/OfferComparator'
import { UpiPayment } from './UpiPayment/UpiPayment'

export { DocumentInspector } from './DocumentInspector/DocumentInspector'
export { FormFiller } from './FormFiller/FormFiller'
export { MessageTriage } from './MessageTriage/MessageTriage'
export { OfferComparator } from './OfferComparator/OfferComparator'
export { UpiPayment } from './UpiPayment/UpiPayment'

export const interactions: InteractionRegistry = {
  formFiller: FormFiller,
  documentInspector: DocumentInspector,
  upiPayment: UpiPayment,
  messageTriage: MessageTriage,
  offerComparator: OfferComparator,
}