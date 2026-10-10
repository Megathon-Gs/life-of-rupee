import { expect, test as base } from '@playwright/test'

type PrivacyFixtures = { networkAllowlist: void }

export const test = base.extend<PrivacyFixtures>({
  networkAllowlist: [
    async ({ page, baseURL }, use) => {
      const unexpected: string[] = []
      const appOrigin = baseURL ? new URL(baseURL).origin : ''
      page.on('request', (request) => {
        if (!appOrigin) return
        const origin = new URL(request.url()).origin
        if (origin !== appOrigin) unexpected.push(request.url())
      })
      await use()
      expect(unexpected, `Unexpected network requests: ${unexpected.join(', ')}`).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
