import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { AttemptRecord, LevelDef, LocationId, SaveFile } from '@/core/contracts'
import { migrate } from '@/core/state'
import { v1Fixture } from '@/core/state/migrations/fixtures'
import { world } from '@/content/world'
import { renderUi } from '@/ui/testing/renderUi'
import { fixtureBankLevel } from '../../tests/e2e/fixtures/levels'
import { LevelPanel } from './LevelPanel'
import { createGameStore, GameStoreContext } from './store'

const save = (): SaveFile => ({ ...migrate(structuredClone(v1Fixture)), attempts: [] })

const stepType = () => screen.getByTestId('level-step').getAttribute('data-step-type')

function setup(initial = save(), shownLevel: LevelDef = fixtureBankLevel) {
  const levels = [shownLevel]
  const store = createGameStore(initial, { levels, locations: world.locations })
  const onCompleted = vi.fn()
  const onClose = vi.fn()
  const view = renderUi(
    <GameStoreContext.Provider value={store}>
      <LevelPanel
        level={shownLevel}
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
  it('shows the location backdrop until the lesson unmounts', () => {
    const { view } = setup()
    expect(screen.getByTestId('interior-backdrop').querySelector('img')?.getAttribute('src')).toBe(
      '/interiors/bank.png',
    )
    view.unmount()
    expect(screen.queryByTestId('interior-backdrop')).toBeNull()
  })

  it('does not add a backdrop to an unmapped location', () => {
    setup(save(), { ...fixtureBankLevel, location: 'home' as LocationId })
    expect(screen.queryByTestId('interior-backdrop')).toBeNull()
    expect(stepType()).toBe('hook')
  })

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

  it('shows the saved first attempt and improved best after replay', async () => {
    const initial = save()
    initial.attempts = [
      {
        ...(v1Fixture.attempts[0] as unknown as AttemptRecord),
        id: 'first',
        levelId: fixtureBankLevel.id,
        stars: 2,
      },
    ]
    const user = userEvent.setup()
    const { store } = setup(initial)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: /Stamp/ }))
    await user.click(screen.getByRole('button', { name: 'Right box' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: /Stamp/ }))

    expect(await screen.findByText('Best: ★★★ (first try ★★); improved by 1 star.')).toBeTruthy()
    expect(store.derived().firstStars[fixtureBankLevel.id]).toBe(2)
    expect(store.derived().bestStars[fixtureBankLevel.id]).toBe(3)
  })

  it('records a wrong then a right choice before moving on', async () => {
    const user = userEvent.setup()
    const initial = save()
    initial.position = {
      locationId: initial.position.locationId,
      inLevel: { levelId: fixtureBankLevel.id, stepIndex: 3, events: [] },
    }
    const { store } = setup(initial)
    expect(stepType()).toBe('decision')

    await user.click(screen.getByRole('button', { name: 'Wrong box' }))
    expect(stepType()).toBe('decision')
    expect(store.getState().save.position.inLevel).toMatchObject({
      stepIndex: 3,
      events: [
        { kind: 'choice', stepId: 'decision', correct: false, error: 'bank.wrong_document' },
      ],
    })

    await user.click(screen.getByRole('button', { name: 'Right box' }))
    expect(stepType()).toBe('consequence')
    const inLevel = store.getState().save.position.inLevel
    expect(inLevel?.stepIndex).toBe(4)
    expect(inLevel?.events.map((e) => e.kind === 'choice' && e.correct)).toEqual([false, true])
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

  it('resuming at a ScenarioChain step drops that step’s events from the save', () => {
    const chainLevel: LevelDef = {
      ...fixtureBankLevel,
      steps: fixtureBankLevel.steps.map((step) =>
        step.type === 'decision' ? { ...step, interaction: 'scenarioChain' as never } : step,
      ) as LevelDef['steps'],
    }
    const initial = save()
    initial.position = {
      locationId: initial.position.locationId,
      inLevel: {
        levelId: chainLevel.id,
        stepIndex: 3,
        events: [
          { kind: 'choice', stepId: 'lesson', correct: true },
          { kind: 'hint', stepId: 'decision', level: 1 },
          { kind: 'choice', stepId: 'decision', correct: true },
        ],
      },
    }
    const { store } = setup(initial, chainLevel)
    expect(store.getState().save.position.inLevel).toMatchObject({
      stepIndex: 3,
      events: [{ kind: 'choice', stepId: 'lesson', correct: true }],
    })
  })
})
