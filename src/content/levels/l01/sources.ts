import { SourceDefSchema } from '@/core/contracts'

/** Official pages read in full for Level 1 on 2026-10-11. */
export const sources = [
  {
    id: 'ncfe-financial-wellbeing',
    publisher: 'National Centre for Financial Education (NCFE)',
    title: 'Financial Wellbeing (NCFE awareness page)',
    url: 'https://ncfe.org.in/financial-wellbeing/',
    retrievedOn: '2026-10-11',
  },
  {
    id: 'rbi-fame-school-children',
    publisher: 'Reserve Bank of India',
    title: 'Financial Literacy for School Children, Message 1: Needs versus Wants (FAME series, April 2018)',
    url: 'https://www.rbi.org.in/financialeducation/content/01SCHOOL20042018.pdf',
    retrievedOn: '2026-10-11',
  },
].map(source => SourceDefSchema.parse(source))
