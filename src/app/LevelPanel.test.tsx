import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SaveFile } from '@/core/contracts'
import { migrate } from '@/core/state'
import { v1Fixture } from '@/core/state/migrations/fixtures'
import { world } from '@/content/world'
import { renderUi } from '@/ui/testing/renderUi'
import { fixtureBankLevel } from '../../tests/e2e/fixtures/levels'
import { LevelPanel } from './LevelPanel'
import { createGameStore, GameStoreContext } from './store'

const save = (): SaveFile => ({ ...migrate(structuredClone(v1Fixture)), attempts: [] })
const levels = [fixtureBankLevel]

const stepType = () => screen.getByTestId('level-step').getAttribute('data-step-type')

function setup(initial = save()) {
  const store = createGameStore(initial, { levels, locations: world.locations })
  const onCompleted = vi.fn()
  const onClose = vi.fn()
  const view = renderUi(
    <GameStoreContext.Provider value={store}>
      <LevelPanel
        level={fixtureBankLevel}
        levels={levels}
        locale="en"
        test
        onCompleted={onCompleted}
        onClose={onClose}
      />
    </GameStoreContext.Provider>,
    { reducedMotion: true },
  )
  return { store, onCompleted, onClose, view }
}

describe('LevelPanel', () => {
  it('plays the fixture level to results and records the attempt', async () => {
    const user = userEvent.setup()
    const { store, onCompleted, onClose } = setup()
    expect(stepType()).toBe('hook')
    expect(store.getState().save.position.inLevel?.levelId).toBe(fixtureBankLevel.id)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(stepType()).toBe('lesson')
    await user.click(screen.getByRole('button', { name: /Stamp/ }))
    // Travel is completed automatically: the player is already at the bank.
    expect(stepType()).toBe('decision')
    expect(store.getState().save.position.inLevel?.stepIndex).toBe(3)

    await user.click(screen.getByRole('button', { name: 'Right box' }))
    expect(stepType()).toBe('consequence')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(stepType()).toBe('transfer')
    await user.click(screen.getByRole('button', { name: /Stamp/ }))

    expect(await screen.findByTestId('results')).toBeTruthy()
    expect(onCompleted).toHaveBeenCalledTimes(1)
    const { attempts, position } = store.getState().save
    expect(attempts).toHaveLength(1)
    expect(attempts[0]!.stars).toBe(3)
    expect(position.inLevel).toBeUndefined()
    expect(store.derived().worldFlags['bank.accountOpened']).toBe('true')

    await user.click(screen.getByRole('button', { name: 'Back to the street' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('resumes a saved mid-level snapshot at the same step', () => {
    const initial = save()
    initial.position = {
      locationId: initial.position.locationId,
      inLevel: { levelId: fixtureBankLevel.id, stepIndex: 3, events: [] },
    }
    setup(initial)
    expect(stepType()).toBe('decision')
  })
})
