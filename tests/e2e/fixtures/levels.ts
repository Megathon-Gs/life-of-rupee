import { LevelDefSchema, type LevelDef } from '@/core/contracts'
import { defaultRubric } from '@/core/scoring'

const documentConfig = (titleKey: string) => ({
  titleKey,
  promptKey: 'app:fixture.document.prompt',
  fields: [
    {
      id: 'stamp',
      labelKey: 'app:fixture.document.stampLabel',
      valueKey: 'app:fixture.document.stampValue',
      isAnswer: true,
    },
    {
      id: 'doodle',
      labelKey: 'app:fixture.document.doodleLabel',
      valueKey: 'app:fixture.document.doodleValue',
      isAnswer: false,
      error: 'kyc.wrong_document',
    },
  ],
})

/**
 * Fictional e2e level at the bank: one right answer per step, so a test can finish it
 * in a few taps. Parsed through the schema so it stays a valid `LevelDef`.
 */
export const fixtureBankLevel: LevelDef = LevelDefSchema.parse({
  id: 'fixture-bank',
  skillNodes: ['access.identity'],
  location: 'bank',
  steps: [
    { id: 'hook', type: 'hook', lineKeys: ['app:fixture.hook.1', 'app:fixture.hook.2'] },
    {
      id: 'lesson',
      type: 'lesson',
      interaction: 'documentInspector',
      config: documentConfig('app:fixture.document.title'),
    },
    { id: 'travel', type: 'travel', location: 'bank' },
    {
      id: 'decision',
      type: 'decision',
      interaction: 'formFiller',
      config: {
        titleKey: 'app:fixture.form.title',
        fields: [
          {
            id: 'route',
            labelKey: 'app:fixture.form.routeLabel',
            options: [
              { id: 'right', labelKey: 'app:fixture.form.right' },
              { id: 'wrong', labelKey: 'app:fixture.form.wrong' },
            ],
            correctOptionId: 'right',
            error: 'bank.wrong_document',
          },
        ],
      },
      rubric: defaultRubric,
    },
    {
      id: 'consequence',
      type: 'consequence',
      outcomeKeys: ['app:fixture.consequence.outcome'],
      explanationKey: 'app:fixture.consequence.explanation',
    },
    {
      id: 'transfer',
      type: 'transfer',
      variants: [
        {
          id: 'only',
          interaction: 'documentInspector',
          config: documentConfig('app:fixture.transfer.title'),
        },
      ],
    },
  ],
  worldEffects: [{ key: 'bank.accountOpened', value: 'true' }],
  claims: [],
})

/** Every fixture level the app may register in test mode. */
export const fixtureLevels: LevelDef[] = [fixtureBankLevel]
