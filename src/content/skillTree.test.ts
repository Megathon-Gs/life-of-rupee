import { describe, expect, it } from 'vitest'
import { SkillTreeDefSchema } from '@/core/contracts'
import { levels } from './levels'
import { LEVEL_SKILL_NODES, skillTree } from './skillTree'

const nodeIds = new Set(skillTree.nodes.map((n) => n.id as string))

describe('skill tree content', () => {
  it('has every registered level skill node in the tree', () => {
    expect(levels).toHaveLength(12)
    for (const level of levels) {
      for (const node of level.skillNodes) expect(nodeIds.has(node as string)).toBe(true)
    }
  })

  it('validates against SkillTreeDefSchema', () => {
    expect(SkillTreeDefSchema.safeParse(skillTree).success).toBe(true)
  })

  it('has exactly the five product-plan branches', () => {
    expect(skillTree.branches.map((b) => b.id)).toEqual([
      'money-management',
      'financial-access',
      'financial-safety',
      'borrowing',
      'growth-economy',
    ])
  })

  it('keeps every node inside a declared branch', () => {
    const branches = new Set(skillTree.branches.map((b) => b.id))
    for (const n of skillTree.nodes) expect(branches.has(n.branch)).toBe(true)
  })

  it('maps every level 1–12 to at least one existing node', () => {
    for (let level = 1; level <= 12; level++) {
      const nodes = LEVEL_SKILL_NODES[level]
      expect(nodes).toBeDefined()
      expect(nodes!.length).toBeGreaterThan(0)
      for (const id of nodes!) expect(nodeIds.has(id as string)).toBe(true)
    }
  })

  it('references only known nodes from edges', () => {
    for (const e of skillTree.edges) {
      expect(nodeIds.has(e.from as string)).toBe(true)
      expect(nodeIds.has(e.to as string)).toBe(true)
    }
  })
})