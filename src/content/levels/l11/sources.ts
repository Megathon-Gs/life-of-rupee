import { SourceDefSchema } from '@/core/contracts'

// Fetched and read on 2026-10-11. Source review is not NGO educator approval.
export const sources = [
  {
    id: 'l11-sebi-investment-factors',
    publisher: 'SEBI',
    title: 'Factors to Consider Before Investing',
    url: 'https://investor.sebi.gov.in/investment-thingsbeforeinv.html',
  },
  {
    id: 'l11-sebi-risk-management',
    publisher: 'SEBI',
    title: 'How to Manage Investment Risks',
    url: 'https://investor.sebi.gov.in/investment_risk_managment.html',
  },
  {
    id: 'l11-sebi-asset-classes',
    publisher: 'SEBI',
    title: 'Avenues for Investments',
    url: 'https://investor.sebi.gov.in/investment-assetclasses.html',
  },
  {
    id: 'l11-sebi-bonds',
    publisher: 'SEBI',
    title: 'Understanding Bonds',
    url: 'https://investor.sebi.gov.in/understanding_bonds.html',
  },
  {
    id: 'l11-sebi-mutual-funds',
    publisher: 'SEBI',
    title: 'Understanding Mutual Funds',
    url: 'https://investor.sebi.gov.in/understanding_mf.html',
  },
  {
    id: 'l11-ncfe-mutual-funds',
    publisher: 'NCFE',
    title: 'Mutual Funds — maturity, risk factors and redemption terms',
    url: 'https://ncfe.org.in/faqs/mutual-fund/',
  },
  {
    id: 'l11-ncfe-banking',
    publisher: 'NCFE',
    title: 'Banking — Types of deposit accounts; Saving beyond the savings account',
    url: 'https://ncfe.org.in/faqs/banking/',
  },
].map((source) => SourceDefSchema.parse({ ...source, retrievedOn: '2026-10-11' }))
