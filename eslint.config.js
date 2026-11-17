import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// `npm run lint` — runs in CI (.github/workflows/ci.yml) before the tests.
export default defineConfig([
  // scripts/legacy holds the retired bulk generator; it is kept for the record, not maintained.
  globalIgnores(['dist', 'scripts/legacy']),

  // Everything: plain JavaScript rules. The app runs in a browser, the proxy
  // and the scripts under node, so both sets of globals are declared.
  {
    files: ['**/*.{js,jsx,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Build-time stamps substituted by vite.config.js `define`.
        __KB_HASH__: 'readonly',
        __ENGINE_HASH__: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',   // exported constants and data tables
        argsIgnorePattern: '^_',        // deliberately unused parameters
        caughtErrors: 'none',
      }],
    },
  },

  // React layer: hooks rules and fast-refresh constraints.
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
    },
  },
])
