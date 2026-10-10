import { SourceDefSchema } from '@/core/contracts'

/** Current RBI circulars read for Level 9. */
export const sources = [
  {
    id: 'rbi-key-facts-statement',
    publisher: 'Reserve Bank of India',
    title: 'Key Facts Statement (KFS) for Loans & Advances (RBI/2024-25/18, April 15, 2024)',
    url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12663&Mode=',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'rbi-penal-charges-loan-accounts',
    publisher: 'Reserve Bank of India',
    title:
      'Fair Lending Practice - Penal Charges in Loan Accounts (RBI/2023-24/53, August 18, 2023)',
    url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12527',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'rbi-emi-personal-loans-reset',
    publisher: 'Reserve Bank of India',
    title:
      'Reset of Floating Interest Rate on Equated Monthly Instalments (EMI) based Personal Loans (RBI/2023-24/55, August 18, 2023, updated as on October 1, 2025)',
    url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12529&Mode=0',
    retrievedOn: '2026-10-10',
  },
].map((source) => SourceDefSchema.parse(source))
