import { SourceDefSchema } from '@/core/contracts'

/**
 * Official pages fetched and read for Level 6 on 2026-10-11.
 * - CBIC Tax Information: CGST Act section 15 (the page notes a pending, not-yet-notified
 *   substitution of clause (3)(b); the clause (3)(a) text used here is unchanged) and CGST Rule 46.
 * - NCFE: school material. Its GST rate list dates from 2017 and is not used; every rate in this
 *   level is a labelled assumption.
 */
export const sources = [
  {
    id: 'cbic-cgst-section-15',
    publisher: 'Central Board of Indirect Taxes and Customs (CBIC), Government of India',
    title: 'Central Goods and Services Tax Act, 2017, Section 15 - Value of taxable supply',
    url: 'https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/acts/2017_CGST_act/active/chapter4/section15_v1.00.html',
    retrievedOn: '2026-10-11',
  },
  {
    id: 'cbic-cgst-rule-46',
    publisher: 'Central Board of Indirect Taxes and Customs (CBIC), Government of India',
    title: 'Central Goods and Services Tax Rules, 2017, Rule 46 - Tax invoice',
    url: 'https://taxinformation.cbic.gov.in/content/html/tax_repository/gst/rules/cgst_rules/active/chapter6/rule46_v1.00.html',
    retrievedOn: '2026-10-11',
  },
  {
    id: 'ncfe-class-6-bill',
    publisher: 'National Centre for Financial Education (NCFE)',
    title: 'Financial Education, Class 6 (school workbook): asking for a bill; indirect taxes and GST',
    url: 'https://ncfe.org.in/wp-content/uploads/2023/12/Class_6th.pdf',
    retrievedOn: '2026-10-11',
  },
  {
    id: 'ncfe-personal-finance-school',
    publisher: 'National Centre for Financial Education (NCFE)',
    title: 'Personal Finance for School Students: Budgeting',
    url: 'https://ncfe.org.in/wp-content/uploads/2023/12/Personal-Finance-for-School-Students.pdf',
    retrievedOn: '2026-10-11',
  },
].map(source => SourceDefSchema.parse(source))
