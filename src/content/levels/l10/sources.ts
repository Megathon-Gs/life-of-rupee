import { SourceDefSchema } from '@/core/contracts'

/**
 * Official pages read for Level 10 on 2026-10-11. The IRDAI consumer-education pages
 * returned HTTP 504 on every attempt that day, so no IRDAI page defines exclusions,
 * deductibles or caps; those terms are taught as the fictional policy's own wording.
 */
export const sources = [
  {
    id: 'ncfe-misselling',
    publisher: 'National Centre for Financial Education (NCFE)',
    title: 'Mis-selling (NCFE awareness page)',
    url: 'https://ncfe.org.in/misselling/',
    retrievedOn: '2026-10-11',
  },
  {
    id: 'ncfe-why-buy-life-insurance',
    publisher: 'National Centre for Financial Education (NCFE)',
    title: 'Why Buy Life Insurance (NCFE blog, March 22, 2024)',
    url: 'https://ncfe.org.in/why-buy-life-insurance/',
    retrievedOn: '2026-10-11',
  },
  {
    id: 'irdai-bima-bharosa',
    publisher: 'Insurance Regulatory and Development Authority of India (IRDAI)',
    title: 'Bima Bharosa (IGMS) policyholder complaints portal',
    url: 'https://bimabharosa.irdai.gov.in/Home/Home',
    retrievedOn: '2026-10-11',
  },
].map(source => SourceDefSchema.parse(source))
