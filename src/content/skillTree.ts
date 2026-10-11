import {
  SkillTreeDefSchema,
  type SkillNodeId,
  type SkillTreeDef,
} from '@/core/contracts'

/**
 * The five skill-tree branches from product plan §7. Node ids are dotted and
 * group by domain; the matching level→node map lives in `LEVEL_SKILL_NODES`
 * below (contracts are frozen, so it is a separate export, not part of the def).
 */
export const skillTree: SkillTreeDef = SkillTreeDefSchema.parse({
  branches: [
    { id: 'money-management', labelKey: 'branch.money-management' },
    { id: 'financial-access', labelKey: 'branch.financial-access' },
    { id: 'financial-safety', labelKey: 'branch.financial-safety' },
    { id: 'borrowing', labelKey: 'branch.borrowing' },
    { id: 'growth-economy', labelKey: 'branch.growth-economy' },
  ],
  nodes: [
    { id: 'money.budgeting', branch: 'money-management', labelKey: 'node.money.budgeting' },
    { id: 'money.saving', branch: 'money-management', labelKey: 'node.money.saving' },
    { id: 'money.spending', branch: 'money-management', labelKey: 'node.money.spending' },
    { id: 'money.independence', branch: 'money-management', labelKey: 'node.money.independence' },
    { id: 'access.identity', branch: 'financial-access', labelKey: 'node.access.identity' },
    { id: 'bank.upi', branch: 'financial-access', labelKey: 'node.access.payments' },
    { id: 'safety.fraud', branch: 'financial-safety', labelKey: 'node.safety.fraud' },
    { id: 'safety.insurance', branch: 'financial-safety', labelKey: 'node.safety.insurance' },
    { id: 'borrowing.income', branch: 'borrowing', labelKey: 'node.borrowing.income' },
    { id: 'borrowing.emi', branch: 'borrowing', labelKey: 'node.borrowing.emi' },
    { id: 'inflation.purchasing_power', branch: 'growth-economy', labelKey: 'node.growth.inflation' },
    { id: 'growth.investing', branch: 'growth-economy', labelKey: 'node.growth.investing' },
  ],
  edges: [
    { from: 'money.budgeting', to: 'money.saving' },
    { from: 'money.budgeting', to: 'money.spending' },
    { from: 'money.saving', to: 'money.independence' },
    { from: 'money.spending', to: 'money.independence' },
    { from: 'access.identity', to: 'bank.upi' },
    { from: 'bank.upi', to: 'safety.fraud' },
    { from: 'safety.fraud', to: 'safety.insurance' },
    { from: 'borrowing.income', to: 'borrowing.emi' },
    { from: 'money.saving', to: 'growth.investing' },
    { from: 'inflation.purchasing_power', to: 'growth.investing' },
    { from: 'growth.investing', to: 'money.independence' },
  ],
})

const node = (id: string) => id as SkillNodeId

/** The skill node(s) each of the twelve levels lights up on completion. */
export const LEVEL_SKILL_NODES: Record<number, SkillNodeId[]> = {
  1: [node('money.budgeting')],
  2: [node('access.identity')],
  3: [node('money.saving')],
  4: [node('bank.upi')],
  5: [node('safety.fraud')],
  6: [node('money.spending')],
  7: [node('inflation.purchasing_power')],
  8: [node('borrowing.income')],
  9: [node('borrowing.emi')],
  10: [node('safety.insurance')],
  11: [node('growth.investing')],
  12: [node('money.independence')],
}