import { LevelDefSchema, type LevelDef } from '@/core/contracts'
import { defaultRubric } from '@/core/scoring'

/** Fictional test level; parsed through the schema so it stays a valid `LevelDef`. */
export const fixtureLevel: LevelDef = LevelDefSchema.parse({
  id: 'l99-fixture',
  skillNodes: ['bank.account'],
  location: 'bank',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['fixture.hook.1', 'fixture.hook.2'] },
    { id: 'lesson', type: 'lesson', interaction: 'documentInspector', config: { fields: 2 } },
    { id: 'travel', type: 'travel', location: 'bank' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'formFiller',
      config: { form: 'account' },
      rubric: defaultRubric,
    },
    {
      id: 'consequence',
      type: 'consequence',
      outcomeKeys: ['fixture.outcome'],
      explanationKey: 'fixture.explain',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        { id: 'v-a', interaction: 'documentInspector', config: { amount: 500 } },
        { id: 'v-b', interaction: 'documentInspector', config: { amount: 1200 } },
        { id: 'v-c', interaction: 'documentInspector', config: { amount: 4000 } },
      ],
    },
  ],
  worldEffects: [{ key: 'bankAccount', value: 'opened' }],
  claims: [],
})
