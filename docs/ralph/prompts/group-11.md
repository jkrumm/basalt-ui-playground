# Group 11: Linting + Quality Pipeline

## What You're Doing

Complete the quality toolchain — ESLint flat config with framework-specific plugins (Blueprint, Router, React Compiler), stylelint for Blueprint CSS patterns, and wire everything into the Makefile `check` pipeline. Basic oxlint + oxfmt were set up in Group 1; this group adds the plugin-dependent ESLint rules and fixes any lint violations across the codebase.

---

## Research & Exploration First

1. Research: ESLint flat config with TypeScript (`eslint.config.ts`) — latest setup pattern
2. Research: `eslint-plugin-react-compiler` 1.0 — configuration, rules
3. Research: `@blueprintjs/eslint-plugin` — available rules, no-deprecated-components
4. Research: `@tanstack/eslint-plugin-router` — route safety rules
5. Research: `oxlint-plugin-eslint` — how to skip rules already covered by OxLint
6. Research: Stylelint latest configuration for CSS custom properties
7. Read the existing `eslint.config.ts` in the old codebase for reference
8. Read `oxlint.json` from Group 1 to understand what's already covered

---

## What to Implement

### 1. Add Dependencies (root devDependencies)

- `eslint`
- `@eslint/js`
- `typescript-eslint`
- `eslint-plugin-react-compiler`
- `@blueprintjs/eslint-plugin`
- `@tanstack/eslint-plugin-router`
- `oxlint-plugin-eslint`
- `stylelint`, `stylelint-config-standard`

### 2. eslint.config.ts — Flat Config

```typescript
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactCompiler from "eslint-plugin-react-compiler";
import blueprintPlugin from "@blueprintjs/eslint-plugin";
import routerPlugin from "@tanstack/eslint-plugin-router";
import oxlintPlugin from "oxlint-plugin-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-compiler": reactCompiler,
      "@blueprintjs": blueprintPlugin,
      "@tanstack/router": routerPlugin,
    },
    rules: {
      // React Compiler — error level
      "react-compiler/react-compiler": "error",

      // Blueprint — no deprecated components
      "@blueprintjs/no-deprecated-components": "error",

      // TanStack Router — route safety
      "@tanstack/router/create-route-property-order": "warn",

      // Jotai — atoms must live in ~/atoms/
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["jotai"],
          importNames: ["atom", "atomWithStorage"],
          message: "Import atoms from ~/atoms/ — do not create atoms outside that directory.",
        }],
      }],
    },
  },
  // Skip rules already covered by OxLint
  oxlintPlugin.configs["flat/recommended"],
  {
    ignores: [
      "dist/",
      "node_modules/",
      ".tanstack/",
      ".content-collections/",
      "*.gen.ts",
    ],
  },
);
```

Research the exact plugin APIs — they may differ from what's shown above.

### 3. stylelint.config.js — Blueprint CSS Patterns

```javascript
export default {
  extends: ["stylelint-config-standard"],
  rules: {
    // Use CSS custom properties (not hardcoded colors)
    // Follow Blueprint class naming conventions
    // Prevent !important on Blueprint overrides
  },
};
```

### 4. Update Makefile

```makefile
lint:
	bunx oxlint .
	bunx eslint .

fmt:
	bunx oxfmt --check .

fmt-fix:
	bunx oxfmt .

check: fmt lint typecheck test
```

Verify the exact CLI commands for oxlint, eslint, and oxfmt with their current versions.

### 5. Fix All Lint Violations

Run the full lint pipeline and fix all violations across the codebase:
- Fix React Compiler violations (if any)
- Fix Blueprint deprecated component usage
- Fix import ordering
- Fix formatting issues (oxfmt)
- Fix any TypeScript ESLint issues

**Do NOT refactor code that isn't violating lint rules.** Only fix actual violations.

### 6. Update Root Scripts

Ensure `package.json` scripts for `lint`, `fmt`, and `check` are correct and work.

---

## Validation

```bash
# Full quality pipeline
bun run fmt                     # format check passes
bun run lint                    # all lint rules pass
bun run typecheck               # TypeScript clean
make check                      # combined check passes

# Verify lint catches intentional errors
# (manually introduce a Blueprint deprecated component, verify lint catches it, then revert)
```

---

## Commit

```
chore(quality): add ESLint flat config with Blueprint, Router, and React Compiler plugins
```

---

## Done

Append learning notes to `docs/ralph/RALPH_NOTES.md`, then:
```
RALPH_TASK_COMPLETE: Group 11
```
