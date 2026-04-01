import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactCompiler from "eslint-plugin-react-compiler";
import blueprintPlugin from "@blueprintjs/eslint-plugin";
import routerPlugin from "@tanstack/eslint-plugin-router";
import oxlint from "eslint-plugin-oxlint";

export default tseslint.config(
  // Ignores must be first — ESLint processes them in order
  {
    ignores: [
      "~/",
      "**/dist/",
      "**/node_modules/",
      "**/.tanstack/",
      "**/.content-collections/",
      "**/.output/",
      "**/.vite/",
      "**/*.gen.ts",
      "**/drizzle/",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  reactCompiler.configs.recommended,
  {
    plugins: {
      "@blueprintjs": blueprintPlugin,
    },
    rules: {
      "@blueprintjs/classes-constants": "error",
      "@blueprintjs/html-components": "error",
      "@blueprintjs/no-deprecated-components": "error",
      "@blueprintjs/no-deprecated-type-references": "error",
    },
  },
  ...routerPlugin.configs["flat/recommended"],
  {
    rules: {
      // Jotai — atoms must live in ~/atoms/
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["jotai", "jotai/utils"],
              importNames: ["atom", "atomWithStorage"],
              message: "Import atoms from ~/atoms/ — do not create atoms outside that directory.",
            },
          ],
        },
      ],
    },
  },
  // Allow atom creation in ~/atoms/ directory
  {
    files: ["**/atoms/**"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Must be last — disables ESLint rules already covered by OxLint
  ...oxlint.buildFromOxlintConfigFile("./oxlint.json"),
);
