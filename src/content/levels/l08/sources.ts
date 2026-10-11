import { SourceDefSchema } from '@/core/contracts'

/**
 * Official page read for Level 8. NCFE's site was also read for salary and payslip material and had
 * none, so the deduction-purpose claims are kept to what the Income Tax page states.
 */
export const sources = [
  {
    id: 'itd-salaried-individuals',
    publisher: 'Income Tax Department, Government of India',
    title: 'Salaried Individuals for AY 2026-27',
    url: 'https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1',
    retrievedOn: '2026-10-11',
  },
].map(source => SourceDefSchema.parse(source))
