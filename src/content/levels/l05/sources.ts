import { SourceDefSchema } from '@/core/contracts'

/** Official RBI, NPCI and Government of India pages fetched and read for Level 5. */
export const sources = [
  {
    id: 'rbi-cyber-threats-advisory',
    publisher: 'Reserve Bank of India',
    title: 'Consumer Awareness - Cyber Threats and Frauds (press release, January 28, 2022)',
    url: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=53185',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'rbi-kyc-fraud-leaflet',
    publisher: 'Reserve Bank of India',
    title: 'Beware of KYC fraud! Unknown Link = Unknown Risk (Financial Literacy Week 2026 leaflet)',
    url: 'https://m.rbi.org.in/FinancialEducation/FLW2026/English/69656_RBI%20FLW%20KYC%20Fraud%20POSM_Leaflet%20A5.pdf',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'rbi-fictitious-offers',
    publisher: 'Reserve Bank of India',
    title: 'RBI cautions Public Once Again against Fictitious Offers (press release, February 6, 2012)',
    url: 'https://www.rbi.org.in/commonman/english/scripts/PressReleases.aspx?Id=2440',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'npci-upi-safety-shield',
    publisher: 'National Payments Corporation of India',
    title: 'Unified Payments Interface Safety Shield - Safety Features',
    url: 'https://www.npci.org.in/safety-feature',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'npci-fraud-awareness',
    publisher: 'National Payments Corporation of India',
    title: 'Fraud Awareness - Fraud trends against which users should be vigilant',
    url: 'https://www.npci.org.in/fraud-awareness',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'ncrp-complaint-portal',
    publisher: 'Ministry of Home Affairs, Government of India (National Cyber Crime Reporting Portal)',
    title: 'Filing a Complaint on National Cyber Crime Reporting Portal',
    url: 'https://cybercrime.gov.in/Webform/Accept.aspx',
    retrievedOn: '2026-10-10',
  },
].map(source => SourceDefSchema.parse(source))
