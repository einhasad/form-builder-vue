import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      rollupTypes: true,
      exclude: ['src/__tests__/**'],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FormBuilderVue',
      fileName: 'form-builder-vue',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: [
        'src/types/form-data.ts',
        'src/types/control-definition.ts',
        'src/types/builder-options.ts',
        'src/types/renderer-options.ts',
        'src/types/user-data.ts',
        'src/types/field-event.ts',
        'src/types/common.ts',
        'src/types/builder-state.ts',
        'src/types/index.ts',
      ],
    },
  },
})
