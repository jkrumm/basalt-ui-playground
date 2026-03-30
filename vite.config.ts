import { defineConfig } from "vite";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns: [
      "dist/**",
      ".output/**",
      "apps/web/.tanstack/**",
      "apps/web/.content-collections/**",
      "node_modules/**",
      "**/*.gen.ts",
      "apps/web/src/routeTree.gen.ts",
    ],
  },
  lint: {
    categories: {
      suspicious: "warn",
    },
    jsPlugins: [
      "eslint-plugin-react-compiler",
      "@blueprintjs/eslint-plugin",
      "@tanstack/eslint-plugin-router",
      "oxlint-plugin-eslint",
    ],
    rules: {
      "unicorn/no-useless-fallback-in-spread": "off",
      "unicorn/no-empty-file": "off",
      "no-unsafe-type-assertion": "off",
      // ESLint plugin rules
      "react-compiler/react-compiler": "error",
      "@blueprintjs/no-deprecated-components": "warn",
      "@blueprintjs/no-deprecated-core-components": "warn",
      "@blueprintjs/no-deprecated-type-references": "warn",
      "@tanstack/router/create-route-property-order": "warn",
      // Blueprint & Jotai restricted syntax patterns
      "eslint-js/no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name=/^(icon|leftIcon|rightIcon)$/][value.type='Literal']",
          message:
            "Use a Blueprint icon component from @blueprintjs/icons (e.g. leftIcon={<Search />}) or a Tabler component in leftElement/rightElement. String names load all icons lazily and are not tree-shakeable.",
        },
        {
          selector:
            "JSXAttribute[name.name=/^(leftIcon|rightIcon)$/] JSXOpeningElement[name.name=/^Icon[A-Z]/]",
          message:
            "Tabler icons cannot be used in leftIcon/rightIcon — Blueprint routes these through <Icon> and layout breaks. Use a Blueprint icon component (e.g. leftIcon={<Search />}) or move the Tabler icon to leftElement/rightElement.",
        },
        {
          selector:
            "ImportDeclaration[source.value='@blueprintjs/icons'] > ImportSpecifier[imported.name=/^(IconSvgPaths16|IconSvgPaths20|getIconPaths|allPaths)$/]",
          message:
            "IconSvgPaths16/20, getIconPaths, and allPaths load every icon path into one chunk — defeats tree-shaking. Import individual icon components: import { Search } from '@blueprintjs/icons'.",
        },
        {
          selector:
            "VariableDeclarator[init.type='CallExpression'][init.callee.name=/^atom/]:not([id.name=/.+Atom$/])",
          message:
            "Jotai atoms must use the *Atom naming convention (e.g., viewModeAtom, not viewMode).",
        },
        {
          selector: "CallExpression[callee.name='atomFamily']",
          message: "atomFamily is broken with React Compiler. Use static atoms instead.",
        },
        // Zod v4: standalone format validators — z.email(), z.url(), z.uuid() etc.
        {
          selector:
            "CallExpression[callee.type='MemberExpression'][callee.property.name=/^(email|url|uuid|cuid|cuid2|ulid|ip|emoji|nanoid)$/][callee.object.type='CallExpression'][callee.object.callee.property.name='string']",
          message:
            "Zod v4: use standalone format validators — z.email(), z.url(), z.uuid() etc. instead of z.string().email().",
        },
      ],
      // Jotai atom location enforcement
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@sinclair/typebox*"],
              message:
                "TypeBox has been removed. Use Zod v4 instead: z.object(), z.string(), z.email(), z.url() etc.",
            },
          ],
          paths: [
            {
              name: "jotai",
              importNames: ["atom"],
              message: "Define atoms in src/atoms/ and import from '~/atoms' instead.",
            },
            {
              name: "jotai/utils",
              importNames: ["atomWithStorage"],
              message: "Define atoms in src/atoms/ and import from '~/atoms' instead.",
            },
          ],
        },
      ],
    },
    overrides: [
      {
        files: ["apps/web/src/**/*.{ts,tsx}"],
        rules: {
          "eslint-js/no-restricted-syntax": [
            "error",
            {
              selector: "CallExpression[callee.name=/^atom/]",
              message:
                "Jotai atoms must be defined in src/atoms/, not inline in components or routes.",
            },
          ],
        },
      },
      {
        files: ["apps/web/src/atoms/**"],
        rules: {
          "no-restricted-imports": "off",
          "eslint-js/no-restricted-syntax": "off",
        },
      },
    ],
    ignorePatterns: ["dist/**", "apps/web/.tanstack/**", "apps/web/src/routeTree.gen.ts"],
    options: {
      typeAware: true,
    },
  },
});
