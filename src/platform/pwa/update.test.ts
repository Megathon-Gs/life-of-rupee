import { afterEach, describe, expect, test, vi } from 'vitest'
import { createUpdateGate, type UpdateGate, type UpdateGateOptions } from './update'

const toast = () => document.querySelector<HTMLElement>('[data-testid="pwa-update"]')
const toastVisible = () => toast()?.style.display === 'flex'

function mountLevelStep(): HTMLElement {
  const node = document.createElement('div')
  node.dataset.testid = 'level-step'
  document.body.append(node)
  return node
}

describe('createUpdateGate', () => {
  const gates: UpdateGate[] = []
  const gate = (options: UpdateGateOptions = { applyUpdate: vi.fn(async () => {}) }) => {
    const created = createUpdateGate(options)
    gates.push(created)
    return created
  }

  afterEach(() => {
    gates.splice(0).forEach((created) => created.dispose())
    document.querySelector('[data-testid="level-step"]')?.remove()
  })

  test('offers an update only outside a level', async () => {
    const gate1 = gate()
    gate1.markReady()
    expect(toastVisible()).toBe(true)

    const level = mountLevelStep()
    await vi.waitFor(() => expect(toastVisible()).toBe(false))

    level.remove()
    await vi.waitFor(() => expect(toastVisible()).toBe(true))
  })

  test('applies a simulated update on explicit user action', async () => {
    const applyUpdate = vi.fn(async () => {})
    const reload = vi.fn()
    const gate1 = gate({ applyUpdate, reload })
    gate1.simulate()

    toast()!.querySelector('button')!.click()

    await vi.waitFor(() => expect(applyUpdate).toHaveBeenCalledOnce())
    await vi.waitFor(() => expect(reload).toHaveBeenCalledOnce())
    expect(toastVisible()).toBe(false)
  })
})