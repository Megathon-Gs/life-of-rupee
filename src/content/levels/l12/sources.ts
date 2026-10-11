import { SourceDefSchema } from '@/core/contracts'

// Official pages already read for Levels 1–11 and reused here on 2026-10-11; no new claim needs a
// new source. Source review is not NGO educator approval.
export const sources = [
  {
    id: 'l12-ncfe-financial-planning',
    publisher: 'NCFE',
    title: 'Financial Planning FAQs — What is Financial Planning? / Not just saving',
    url: 'https://ncfe.org.in/faqs/financial-planning/',
  },
  {
    id: 'l12-ncfe-banking',
    publisher: 'NCFE',
    title: 'Banking — Types of deposit accounts; Saving beyond the savings account',
    url: 'https://ncfe.org.in/faqs/banking/',
  },
  {
    id: 'l12-npci-upi-safety',
    publisher: 'National Payments Corporation of India',
    title: 'BHIM FAQs — UPI PIN, beneficiary verification and collect requests',
    url: 'https://www.bhimupi.org.in/faq-s.html',
  },
  {
    id: 'l12-rbi-cyber-threats',
    publisher: 'Reserve Bank of India',
    title: 'Consumer Awareness - Cyber Threats and Frauds (press release, January 28, 2022)',
    url: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=53185',
  },
  {
    id: 'l12-rbi-kfs',
    publisher: 'Reserve Bank of India',
    title: 'Key Facts Statement (KFS) for Loans & Advances (RBI/2024-25/18, April 15, 2024)',
    url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12663&Mode=',
  },
  {
    id: 'l12-sebi-investment-factors',
    publisher: 'SEBI',
    title: 'Factors to Consider Before Investing',
    url: 'https://investor.sebi.gov.in/investment-thingsbeforeinv.html',
  },
  {
    id: 'l12-rbi-financial-literacy',
    publisher: 'Reserve Bank of India',
    title: 'Financial Literacy Guide — What is interest? (printed page 12)',
    url: 'https://www.rbi.org.in/FinancialEducation/content/GUIDE310113_F.pdf',
  },
].map((source) => SourceDefSchema.parse({ ...source, retrievedOn: '2026-10-11' }))
