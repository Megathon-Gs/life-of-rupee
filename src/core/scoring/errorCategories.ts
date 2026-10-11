import { ErrorCategoryDefSchema, type ErrorCategoryDef } from '../contracts'

export const errorCategories: Readonly<Record<string, ErrorCategoryDef>> = Object.fromEntries(
  [
    { code: 'upi.pin_to_receive', severity: 'critical', skillNode: 'bank.upi' },
    { code: 'upi.wrong_payee', severity: 'major', skillNode: 'bank.upi' },
    { code: 'upi.declined_payment', severity: 'minor', skillNode: 'bank.upi' },
    { code: 'fraud.shared_otp', severity: 'critical', skillNode: 'safety.fraud' },
    { code: 'fraud.clicked_link', severity: 'major', skillNode: 'safety.fraud' },
    { code: 'fraud.misclassified', severity: 'minor', skillNode: 'safety.fraud' },
    { code: 'fraud.paid_request', severity: 'critical', skillNode: 'safety.fraud' },
    { code: 'loan.ignored_total_cost', severity: 'major', skillNode: 'borrowing.emi' },
    { code: 'loan.emi_only', severity: 'major', skillNode: 'borrowing.emi' },
    { code: 'loan.missed_payment', severity: 'major', skillNode: 'borrowing.emi' },
    {
      code: 'inflation.nominal_vs_real',
      severity: 'major',
      skillNode: 'inflation.purchasing_power',
    },
{ code: 'payslip.gross_as_net', severity: 'major', skillNode: 'borrowing.income' },
    { code: 'insurance.excluded_event', severity: 'major', skillNode: 'safety.insurance' },
    { code: 'insurance.ignored_deductible', severity: 'major', skillNode: 'safety.insurance' },
    { code: 'kyc.wrong_document', severity: 'major', skillNode: 'access.identity' },
    { code: 'bank.wrong_document', severity: 'minor', skillNode: 'access.identity' },
  ].map((definition) => [
    definition.code,
    ErrorCategoryDefSchema.parse({ ...definition, reviewKey: `${definition.code}.review` }),
  ]),
)
