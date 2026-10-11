import { SourceDefSchema } from '@/core/contracts'

// Fetched and read on the retrieval date: RBI printed p.12 (interest), NCFE “Not just saving”.
// Only the enduring concepts are used; no historical rates, product rules or recommendations.
export const sources = [
  {
    id: 'l07-rbi-financial-literacy-guide',
    publisher: 'Reserve Bank of India',
    title: 'Financial Literacy Guide — What is interest? (printed page 12)',
    url: 'https://www.rbi.org.in/FinancialEducation/content/GUIDE310113_F.pdf',
    retrievedOn: '2026-10-11',
  },
  {
    id: 'l07-ncfe-financial-planning',
    publisher: 'National Centre for Financial Education',
    title: 'Financial Planning FAQs — What is Financial Planning? / Not just saving',
    url: 'https://ncfe.org.in/faqs/financial-planning/',
    retrievedOn: '2026-10-11',
  },
].map(source => SourceDefSchema.parse(source))
