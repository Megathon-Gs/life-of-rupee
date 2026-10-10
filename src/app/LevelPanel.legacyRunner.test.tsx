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

// The older runner had no `complete()` and moved on at the first correct choice. This stub
// reproduces that on top of whichever runner is installed.
vi.mock('@/level-runner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/level-runner')>()
  return {
    ...actual,
    createLevelRunner: (deps: Parameters<typeof actual.createLevelRunner>[0]) => {
      const real = actual.createLevelRunner(deps) as ReturnType<typeof actual.createLevelRunner> & {
        complete?: () => boolean
      }
      const { complete, ...rest } = real
      const dispatch: typeof real.dispatch = (input) => {
        const before = real.current().stepIndex
        const accepted = real.dispatch(input)
        const correct = accepted && input.kind === 'choice' && input.correct
        if (correct && complete && real.current().stepIndex === before) complete()
        return accepted
      }
      return { ...rest, dispatch }
    },
  }
})

const save = (): SaveFile => ({ ...migrate(structuredClone(v1Fixture)), attempts: [] })

describe('LevelPanel with a runner that has no complete()', () => {
  it('still plays the fixture level to results', async () => {
    const user = userEvent.setup()
    const levels = [fixtureBankLevel]
    const store = createGameStore(save(), { levels, locations: world.locations })
    renderUi(
      <GameStoreContext.Provider value={store}>
        <LevelPanel
          level={fixtureBankLevel}
          levels={levels}
          locale="en"
          test
          onCompleted={() => {}}
          onClose={() => {}}
        />
      </GameStoreContext.Provider>,
      { reducedMotion: true },
    )
    const stepType = () => screen.getByTestId('level-step').getAttribute('data-step-type')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: /Stamp/ }))
    expect(stepType()).toBe('decision')
    await user.click(screen.getByRole('button', { name: 'Right box' }))
    expect(stepType()).toBe('consequence')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: /Stamp/ }))
    expect(await screen.findByTestId('results')).toBeTruthy()
    expect(store.getState().save.attempts).toHaveLength(1)
  })
})
