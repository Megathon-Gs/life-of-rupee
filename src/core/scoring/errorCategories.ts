import { ErrorCategoryDefSchema, type ErrorCategoryDef } from '../contracts'

export const errorCategories: Readonly<Record<string, ErrorCategoryDef>> = Object.fromEntries(
  [
    { code: 'upi.pin_to_receive', severity: 'critical', skillNode: 'bank.upi' },
    { code: 'fraud.shared_otp', severity: 'critical', skillNode: 'fraud.safety' },
    { code: 'loan.ignored_total_cost', severity: 'major', skillNode: 'loan.cost' },
    {
      code: 'inflation.nominal_vs_real',
      severity: 'major',
      skillNode: 'inflation.purchasing_power',
    },
    { code: 'kyc.wrong_document', severity: 'major', skillNode: 'bank.account' },
    { code: 'bank.wrong_document', severity: 'minor', skillNode: 'bank.account' },
  ].map((definition) => [
    definition.code,
    ErrorCategoryDefSchema.parse({ ...definition, reviewKey: `${definition.code}.review` }),
  ]),
)
