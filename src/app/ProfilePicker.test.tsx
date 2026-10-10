import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { ProfileSummary } from '@/core/contracts'
import { renderUi } from '@/ui/testing/renderUi'
import { ProfilePicker } from './ProfilePicker'

const profile = (localId: string, displayName: string): ProfileSummary => ({
  localId,
  avatar: 'player',
  displayName,
})

function Harness({ initial }: { initial: ProfileSummary[] }) {
  const [profiles, setProfiles] = useState(initial)
  return (
    <ProfilePicker
      profiles={profiles}
      busy={false}
      onCreate={() => {}}
      onSelect={() => {}}
      onRemove={(id) => setProfiles((list) => list.filter((p) => p.localId !== id))}
    />
  )
}

describe('ProfilePicker focus', () => {
  it('moves focus through confirm, cancel and remove', async () => {
    const user = userEvent.setup()
    renderUi(<Harness initial={[profile('a', 'Kind Kite'), profile('b', 'Calm River')]} />)

    await user.click(screen.getByTestId('profile-remove-a'))
    expect(document.activeElement).toBe(screen.getByTestId('profile-remove-confirm-a'))
    await user.click(screen.getByRole('button', { name: 'Keep' }))
    expect(document.activeElement).toBe(screen.getByTestId('profile-remove-a'))

    await user.click(screen.getByTestId('profile-remove-a'))
    await user.click(screen.getByTestId('profile-remove-confirm-a'))
    expect(document.activeElement).toBe(screen.getByTestId('profile-select-b'))

    await user.click(screen.getByTestId('profile-remove-b'))
    await user.click(screen.getByTestId('profile-remove-confirm-b'))
    expect(document.activeElement).toBe(screen.getByTestId('profile-new'))
  })
})
