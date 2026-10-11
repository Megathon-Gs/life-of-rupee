export const interiors: Partial<Record<string, string>> = {
  home: '/interiors/home-plain.png',
  bank: '/interiors/bank.png',
  'phone-shop': '/interiors/phone-shop.png',
  showroom: '/interiors/showroom.png',
  market: '/interiors/market.png',
  workplace: '/interiors/workplace.png',
  'insurance-desk': '/interiors/insurance-desk.png',
  'learning-centre': '/interiors/learning-centre.png',
}

const HOME_UPGRADED = '/interiors/home-upgraded.png'

/** The interior image for a location; home upgrades once the savings goal is met. */
export function interiorFor(
  location: string,
  worldFlags: Readonly<Record<string, string>> = {},
): string | undefined {
  if (location === 'home' && worldFlags['savings.goalMet'] === 'true') return HOME_UPGRADED
  return interiors[location]
}
