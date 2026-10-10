import { SourceDefSchema } from '@/core/contracts'

export const sources = [
  {
    id: 'npci-bhim-upi-safety',
    publisher: 'National Payments Corporation of India',
    title: 'BHIM official homepage — receiving money does not require a UPI PIN',
    url: 'https://www.bhimupi.org.in/',
    retrievedOn: '2026-10-10',
  },
  {
    id: 'npci-bhim-upi-faq',
    publisher: 'National Payments Corporation of India',
    title: 'BHIM FAQs — UPI PIN, beneficiary verification and collect requests',
    url: 'https://www.bhimupi.org.in/faq-s.html',
    retrievedOn: '2026-10-10',
  },
].map(source => SourceDefSchema.parse(source))
