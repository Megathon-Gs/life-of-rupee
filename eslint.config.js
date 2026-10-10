import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

// Modules the pure core is never allowed to import. `src/core/**` decides every
// calculation and rule by itself, so it must not reach for the DOM, a renderer,
// persistence or i18n.
const CORE_BANNED = ['react', 'react-dom', 'pixi.js', 'gsap', 'dexie', 'i18next']

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'art/**', 'playwright-report/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: CORE_BANNED.map((name) => ({
            name,
            message: `src/core must stay pure: do not import "${name}".`,
          })),
          patterns: [
            {
              group: CORE_BANNED.map((name) => `${name}/*`),
              message: 'src/core must stay pure: no DOM, renderer, persistence or i18n imports.',
            },
          ],
        },
      ],
    },
  },
]
