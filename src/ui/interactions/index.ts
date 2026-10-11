import { createElement, type ComponentType } from 'react'
import type { InteractionProps, InteractionRegistry, ScenarioChainConfig } from '@/core/contracts'
import { BudgetAllocator } from './BudgetAllocator/BudgetAllocator'
import { DocumentInspector } from './DocumentInspector/DocumentInspector'
import { FormFiller } from './FormFiller/FormFiller'
import { MessageTriage } from './MessageTriage/MessageTriage'
import { OfferComparator } from './OfferComparator/OfferComparator'
import { ReceiptInspector } from './ReceiptInspector/ReceiptInspector'
import { ScenarioChain } from './ScenarioChain/ScenarioChain'
import { TimeSlider } from './TimeSlider/TimeSlider'
import { UpiPayment } from './UpiPayment/UpiPayment'

export { BudgetAllocator } from './BudgetAllocator/BudgetAllocator'
export { DocumentInspector } from './DocumentInspector/DocumentInspector'
export { FormFiller } from './FormFiller/FormFiller'
export { MessageTriage } from './MessageTriage/MessageTriage'
export { OfferComparator } from './OfferComparator/OfferComparator'
export { ReceiptInspector } from './ReceiptInspector/ReceiptInspector'
export { ScenarioChain } from './ScenarioChain/ScenarioChain'
export { TimeSlider } from './TimeSlider/TimeSlider'
export { UpiPayment } from './UpiPayment/UpiPayment'

/** The chain resolves its links through this same registry, looked up lazily at render. */
function RegisteredScenarioChain(props: InteractionProps<ScenarioChainConfig> & { stepId?: string }) {
  return createElement(ScenarioChain, { ...props, registry: interactions })
}

export const interactions: InteractionRegistry & Record<string, ComponentType<never> | undefined> = {
  formFiller: FormFiller,
  documentInspector: DocumentInspector,
  upiPayment: UpiPayment,
  messageTriage: MessageTriage,
  offerComparator: OfferComparator,
  budgetAllocator: BudgetAllocator,
  receiptInspector: ReceiptInspector,
  timeSlider: TimeSlider,
  scenarioChain: RegisteredScenarioChain,
}
