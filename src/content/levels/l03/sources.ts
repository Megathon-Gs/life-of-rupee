import { SourceDefSchema } from '@/core/contracts'

/**
 * Official pages fetched and read for Level 3 on 2026-10-11 (all NCFE, the full text of each page).
 * RBI's current Interest Rate on Deposits directions (Commercial Banks, 2025, updated 1 Oct 2026)
 * could not be read: the PDF host answered with a human-verification page and the rbi.org.in page
 * carries only the title. The superseded 2016 directions were readable but are not current, so no
 * claim relies on RBI text. Premature-withdrawal penalties are taught as the fictional deposit's own
 * terms, and every rate and amount is a fictional assumption.
 */
export const sources = [
  {
    id: 'ncfe-banking-faq',
    publisher: 'National Centre for Financial Education (NCFE)',
    title: 'Banking FAQs (NCFE): saving with banks, types of deposit accounts, fixed deposits',
    url: 'https://ncfe.org.in/faqs/banking/',
    retrievedOn: '2026-10-11',
  },
  {
    id: 'ncfe-fd-calculator',
    publisher: 'National Centre for Financial Education (NCFE)',
    title: 'Fixed Deposit Calculator (NCFE)',
    url: 'https://ncfe.org.in/fixed-deposit-calculator/',
    retrievedOn: '2026-10-11',
  },
  {
    id: 'ncfe-interest-calculator',
    publisher: 'National Centre for Financial Education (NCFE)',
    title: 'Simple and Compound Interest Calculator (NCFE)',
    url: 'https://ncfe.org.in/simple-and-compound-interest-calculator/',
    retrievedOn: '2026-10-11',
  },
].map(source => SourceDefSchema.parse(source))
