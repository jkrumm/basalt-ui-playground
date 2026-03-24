# Group 10: ESLint Hardening Sweep

## What You're Doing

Audit and harden the ESLint configuration to enforce all architectural patterns established in previous groups. Fix all resulting violations. After this group: the ESLint config is a machine-enforced contract of the codebase's patterns — correct patterns are guided by lint, incorrect patterns are blocked at lint time.

---

## Research & Exploration First

1. **Read `apps/web/eslint.config.mjs`** — full current config
2. **Read `apps/web/src/atoms/`** — verify naming convention is already followed before adding enforcement
3. **Run `cd apps/web && bun run lint`** and note ALL current errors/warnings — categorize them
4. **Research `@eslint-react/eslint-plugin` v2** via Context7 or web: what rules are available in the `hooks-extra` namespace? Focus on: `no-direct-set-state-in-use-effect`, `no-unnecessary-use-memo`, `no-unnecessary-use-callback`
5. **Research `eslint-plugin-react-hooks` v7**: the `exhaustive-deps` rule — is it compatible with React Compiler (which may make some deps unnecessary)?
6. **Research antfu eslint-config v7**: what React rules are already included by default? Don't add duplicate rules
7. **Check `eslint-plugin-react-compiler`**: the `react-compiler/react-compiler: error` rule is already configured — verify it's catching any violations in the current codebase

---

## What to Implement

### 1. Run a full lint audit first

```bash
cd apps/web && bun run lint --format compact 2>&1 | tee /tmp/lint-before.txt
```

Categorize errors before touching the config. Fix all pre-existing violations in the codebase first (separate from adding new rules).

### 2. Add `@eslint-react` hooks rules

The `@eslint-react/eslint-plugin` is already installed (`^2.13.0`). Add the hooks-extra rules:

```js
// In apps/web/eslint.config.mjs — add after existing rule blocks
import eslintReact from '@eslint-react/eslint-plugin'

// ...
{
  ...eslintReact.configs.recommended,
  rules: {
    ...eslintReact.configs.recommended.rules,
    // setState called directly inside useEffect body — causes infinite loops
    '@eslint-react/hooks-extra/no-direct-set-state-in-use-effect': 'error',
    // useMemo/useCallback are redundant with React Compiler — warn to clean up
    '@eslint-react/hooks-extra/no-unnecessary-use-memo': 'warn',
    '@eslint-react/hooks-extra/no-unnecessary-use-callback': 'warn',
  },
},
```

**Important**: research the exact rule names in `@eslint-react/eslint-plugin` v2 — they may use a different prefix or namespace than shown above. The package was restructured between v1 and v2.

### 3. Strengthen atom naming enforcement

Expand the `no-restricted-syntax` rule from Group 3 to also enforce that atoms are only defined in `src/atoms/`:

```js
{
  // Only in files OUTSIDE src/atoms/ — atoms must be centralized
  files: ['src/**/*.{ts,tsx}'],
  ignores: ['src/atoms/**'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.name=/^atom/]",
        message: "Jotai atoms must be defined in src/atoms/, not inline in components or routes.",
      },
    ],
  },
},
```

### 4. Add `no-restricted-imports` for state architecture enforcement

Discourage importing Jotai utilities outside `src/atoms/` for atom creation:

```js
{
  rules: {
    'no-restricted-imports': [
      'warn',
      {
        paths: [
          {
            name: 'jotai',
            importNames: ['atom'],
            message: "Define atoms in src/atoms/ and import from '~/atoms' instead.",
          },
          {
            name: 'jotai/utils',
            importNames: ['atomWithStorage'],
            message: "Define atoms in src/atoms/ and import from '~/atoms' instead.",
          },
        ],
      },
    ],
  },
},
```

Add exceptions for `src/atoms/**` files (where atoms are legitimately defined).

### 5. Ban `useEffect` for state derivation (warn, not error)

A soft guardrail — `useEffect` is still valid for side effects (analytics, DOM mutations, subscriptions). This warns when it's used for what should be derived state:

```js
{
  rules: {
    // This is already covered by @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    // Add additional guidance via a comment in the config rather than more rules
  },
}
```

Actually: don't add more rules here. The React Compiler ESLint rule + `no-direct-set-state-in-use-effect` + `exhaustive-deps` is already comprehensive. Avoid over-engineering the lint config.

### 6. Fix all lint violations introduced by new rules

Run lint and fix every violation. Categories to expect:
- `@eslint-react/hooks-extra/no-unnecessary-use-memo` — remove any `useMemo` calls (React Compiler handles these)
- `@eslint-react/hooks-extra/no-unnecessary-use-callback` — remove any `useCallback` calls
- Atom imports outside `src/atoms/` — move atom creation to the atoms directory
- `react-compiler/react-compiler` — fix any Rules of React violations

When fixing violations, prefer the simplest fix. If `useMemo(() => x, [deps])` wraps a cheap computation, just remove the `useMemo`. If it wraps an expensive computation, the Compiler will still memoize it — remove the wrapper and let the Compiler decide.

### 7. Add lint to `packages/schemas` and `packages/api`

Both packages should have basic TypeScript linting. Add minimal ESLint configs:

For `packages/schemas/eslint.config.mjs` and `packages/api/eslint.config.mjs`:
```js
import antfu from '@antfu/eslint-config'
export default antfu({ typescript: true, react: false })
```

Install the shared ESLint deps in each package or rely on workspace hoisting.

---

## Validation

```bash
# apps/web must be completely clean
cd apps/web && bun run lint        # zero errors, zero warnings on new rules

# Optional: also lint the packages
cd packages/api && bun run lint 2>/dev/null || true      # best effort
cd packages/schemas && bun run lint 2>/dev/null || true  # best effort

# TypeScript must still pass
cd apps/web && bun run typecheck
```

---

## Commit

```
chore(eslint): add state pattern enforcement rules and fix all violations
```

---

## Done

Append learning notes. List all violations that were found and fixed. Note any rules that were researched but not added (and why).

```
RALPH_TASK_COMPLETE: Group 10
```
