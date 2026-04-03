export default {
  extends: ["stylelint-config-standard"],
  plugins: ["@blueprintjs/stylelint-plugin"],
  rules: {
    // Blueprint — enforce design tokens over hardcoded colors
    "@blueprintjs/no-color-literal": true,
    // Blueprint — enforce var(--bp-ns) prefix over hardcoded "bp6-" strings
    "@blueprintjs/no-prefix-literal": true,
    // Allow Blueprint class patterns (e.g. .bp6-button)
    "selector-class-pattern": null,
    // Allow CSS custom properties with any naming
    "custom-property-pattern": null,
    // Prevent !important on Blueprint overrides
    "declaration-no-important": true,
    // Allow @apply, @theme, @source (Tailwind v4 directives)
    "at-rule-no-unknown": [
      true,
      { ignoreAtRules: ["apply", "theme", "source", "utility", "variant", "custom-variant"] },
    ],
    // Allow @import with non-standard syntax (Tailwind)
    "import-notation": null,
  },
  ignoreFiles: ["**/node_modules/**", "**/dist/**", "**/.output/**"],
};
