import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import ts from 'typescript-eslint'

export default ts.config(
  // Vue: vue-eslint-parser
  ...pluginVue.configs['flat/recommended'],
  // TS: strict non-type-checked rules globally
  ...ts.configs.strict,
  // Type-checked rules for TS files in src/
  {
    files: ['src/**/*.ts'],
    extends: [...ts.configs.strictTypeChecked, ...ts.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },
  // Vue files in src/: type-checked with vue-eslint-parser wrapping ts.parser
  {
    files: ['src/**/*.vue'],
    extends: [...ts.configs.strictTypeChecked, ...ts.configs.stylisticTypeChecked],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: ts.parser,
        extraFileExtensions: ['.vue'],
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },
  // Config files: relax type-checked rules
  {
    files: ['vite.config.ts', 'eslint.config.js'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
  // Rules
  {
    rules: {
      // Vue — max strictness
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/match-component-file-name': ['error'],
      'vue/no-bare-strings-in-template': ['error'],
      'vue/no-constant-condition': ['error'],
      'vue/no-dupe-keys': ['error'],
      'vue/no-duplicate-attributes': ['error', { allowCoexistClass: true, allowCoexistStyle: false }],
      'vue/no-multiple-slot-args': ['error'],
      'vue/no-mutating-props': ['error'],
      'vue/no-potential-component-option-typo': ['error'],
      'vue/no-ref-as-operand': ['error'],
      'vue/no-reserved-component-names': ['error'],
      'vue/no-restricted-syntax': ['error'],
      'vue/no-static-inline-styles': ['error'],
      'vue/no-undef-components': ['error'],
      'vue/no-undef-properties': ['error'],
      'vue/no-unsupported-features': ['error', { version: '3.5' }],
      'vue/no-unused-emit-declarations': ['error'],
      'vue/no-unused-properties': ['error'],
      'vue/no-unused-vars': ['error'],
      'vue/no-use-computed-property-like-method': ['error'],
      'vue/no-useless-mustaches': ['error'],
      'vue/no-useless-v-bind': ['error'],
      'vue/no-v-html': ['error'],
      'vue/prefer-separate-static-class': ['error'],
      'vue/prefer-template': ['error'],
      'vue/require-direct-export': ['error'],
      'vue/require-explicit-slots': ['error'],
      'vue/require-prop-comment': ['error'],
      'vue/require-prop-type-constructor': ['error'],
      'vue/require-typed-ref': ['error'],
      'vue/return-in-computed-property': ['error'],
      'vue/return-in-emits-validator': ['error'],
      'vue/static-class-names-order': ['error'],
      'vue/use-v-on-exact': ['error'],
      'vue/valid-define-emits': ['error'],
      'vue/valid-define-props': ['error'],
      'vue/no-irregular-whitespace': ['error'],
      'vue/no-restricted-v-bind': ['error', '/^v-/'],
      'vue/html-comment-content-spacing': ['error', 'always'],
      'vue/max-attributes-per-line': ['error', { singleline: { max: 1 } }],
      'vue/singleline-html-element-content-newline': ['error'],

      // TypeScript — extra strict
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'] },
        {
          selector: 'import',
          format: ['camelCase', 'PascalCase'],
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
        },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['PascalCase'] },
        {
          selector: 'property',
          format: null,
          filter: { regex: '^[a-z]+(?:-[a-z]+)+$|[-/:]', match: true },
        },
        {
          selector: 'objectLiteralProperty',
          format: null,
          filter: { regex: '^[a-z]+(?:-[a-z]+)+$|[-/:]', match: true },
        },
        {
          selector: 'typeMethod',
          format: null,
          filter: { regex: '^[a-z]+(?:-[a-z]+)+$|[-/:]', match: true },
        },
        {
          selector: 'objectLiteralMethod',
          format: null,
          filter: { regex: '^[a-z]+(?:-[a-z]+)+$|[-/:]', match: true },
        },
      ],
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-var-requires': 'error',

      // JS base — strict
      'no-console': 'error',
      'no-debugger': 'error',
      'curly': ['error', 'all'],
      'eqeqeq': ['error', 'always'],
      'no-throw-literal': 'error',
      'no-return-await': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'prefer-exponentiation-operator': 'error',
      'prefer-object-spread': 'error',
      'prefer-spread': 'error',
      'prefer-rest-params': 'error',
      'no-param-reassign': 'error',
      'no-shadow': 'off',
      'no-unused-expressions': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-useless-rename': 'error',
      'no-duplicate-imports': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unreachable-loop': 'error',
      'yoda': 'error',
    },
  },
  // Test files: relax rules that conflict with testing patterns
  {
    files: ['src/__tests__/**/*.ts'],
    rules: {
      'vue/one-component-per-file': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  {
    ignores: [
      'dist/**',
      'formBuilder-master/**',
      'coverage/**',
      'demo/**',
      'e2e/**',
      'playwright.config.ts',
      'playwright-report/**',
      'test-results/**',
    ],
  },
)
