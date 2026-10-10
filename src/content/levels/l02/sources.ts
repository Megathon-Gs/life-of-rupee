import { SourceDefSchema } from '@/core/contracts'

/** Current RBI KYC Direction read for Level 2. */
export const sources = [
  {
    id: 'rbi-kyc-master-direction',
    publisher: 'Reserve Bank of India',
    title: 'Master Direction – Know Your Customer (KYC) Direction, 2016 (updated August 14, 2025)',
    url: 'https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=11566',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'rbi-minor-deposit-accounts',
    publisher: 'Reserve Bank of India',
    title: 'Opening of and operation in deposit accounts of minors (April 21, 2025)',
    url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12835&Mode=0',
    retrievedOn: '2026-10-10',
  },
].map(source => SourceDefSchema.parse(source))
