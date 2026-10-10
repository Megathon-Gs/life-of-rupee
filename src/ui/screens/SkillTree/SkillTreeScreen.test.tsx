import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { skillTree } from '@/content/skillTree'
import type { SkillNodeId } from '@/core/contracts'
import { renderUi } from '../../testing/renderUi'
import { SkillTreeScreen, skillNodeStates } from './SkillTreeScreen'

const ids = (...list: string[]) => list as SkillNodeId[]

describe('skillNodeStates', () => {
  it('lights completed nodes, opens nodes whose prerequisites are lit, locks the rest', () => {
    const states = skillNodeStates(skillTree, ids('access.identity'))
    expect(states.get('access.identity')).toBe('lit')
    expect(states.get('access.payments')).toBe('available')
    expect(states.get('safety.fraud')).toBe('locked')
    expect(states.get('money.budgeting')).toBe('available')
  })
})

describe('SkillTreeScreen', () => {
  it('shows five branches, progress and node states from the tree', () => {
    renderUi(<SkillTreeScreen tree={skillTree} completed={ids('money.budgeting', 'access.identity')} />)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(5)
    expect(screen.getByText('2 of 12 skills learned')).toBeTruthy()
    const access = screen.getByRole('region', { name: 'Financial Access' })
    expect(within(access).getByText('Financial Identity').closest('li')?.dataset.state).toBe('lit')
    expect(within(access).getByText('Digital Payments').closest('li')?.dataset.state).toBe('available')
    const safety = screen.getByRole('region', { name: 'Financial Safety' })
    expect(within(safety).getByText('Needs Digital Payments')).toBeTruthy()
  })

  it('marks the node lit by the last level', () => {
    renderUi(<SkillTreeScreen tree={skillTree} completed={ids('access.identity')} justLit={'access.identity' as SkillNodeId} />)
    expect(screen.getByText('Just learned')).toBeTruthy()
  })
})
