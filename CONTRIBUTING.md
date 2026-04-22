# Contributing

Thanks for your interest. This document describes how to set up the project locally and what to check before opening a PR.

## Local setup

```bash
git clone https://github.com/einhasad/form-builder-vue.git
cd form-builder-vue
npm ci
npm run dev          # Vite dev server on http://localhost:5173
```

## Before opening a PR

Every PR must pass the same gate CI runs:

```bash
npm run lint           # ESLint
npm run typecheck      # vue-tsc --noEmit against tsconfig.build.json
npm run test:coverage  # Vitest with 100% coverage threshold
npm run build          # Vite library build + .d.ts rollup
```

All four must be clean. CI runs them on every push and pull request against `main`.

## Testing

- **Unit / component tests** live in `src/__tests__/` — Vitest + `@vue/test-utils`. Coverage threshold is **100%** for statements, branches, functions and lines; add tests alongside any new branch.
- **E2E tests** live in `e2e/`. `demo.spec.ts`, `examples-builder.spec.ts`, and `examples-renderer.spec.ts` run against the local Vite demo and are safe to run in CI.

## Conventions

- **TypeScript strict mode** — see `tsconfig.json` for the full flag set (`noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, etc). No `any`, no `!` non-null assertions.
- **Vue SFC**: `<script setup lang="ts">` only. No Options API, no `defineComponent` default export.
- **Props**: every prop needs a JSDoc (`vue/require-prop-comment`).
- **Types**: `interface` for object shapes, `type` for unions/primitives. Use `import type` for type-only imports.
- **No `console.log`** or `debugger` in committed code.
- **File layout**: components in `src/components/`, types in `src/types/`, composables in `src/composables/`, tests in `src/__tests__/`. Public API re-exports live in `src/index.ts`.

## Commit messages

Short imperative subject line (< 72 chars). Body is optional. Example:
```
Add checkbox-group "other" option handling

Renders an "other" radio that reveals a freeform input when selected.
Mirrors the original formBuilder behaviour.
```

## Reporting security issues

Please see [SECURITY.md](./SECURITY.md) — do not open public issues for vulnerabilities.
