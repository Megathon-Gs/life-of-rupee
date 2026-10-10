import { SourceDefSchema } from '@/core/contracts'

/** Official landing pages used by reviewed financial claims. */
export const sources = [
  {
    id: 'rbi',
    publisher: 'Reserve Bank of India',
    title: 'Reserve Bank of India',
    url: 'https://www.rbi.org.in/',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'npci',
    publisher: 'National Payments Corporation of India',
    title: 'National Payments Corporation of India',
    url: 'https://www.npci.org.in/',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'sebi',
    publisher: 'Securities and Exchange Board of India',
    title: 'Securities and Exchange Board of India',
    url: 'https://www.sebi.gov.in/',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'ncfe',
    publisher: 'National Centre for Financial Education',
    title: 'National Centre for Financial Education',
    url: 'https://ncfe.org.in/',
    retrievedOn: '2026-10-10',
  },
].map(source => SourceDefSchema.parse(source))
