import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['dist', 'src/scripts', 'tailwind.config.js', 'vite.config.js'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, chrome: 'readonly' },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
    },
  },
]