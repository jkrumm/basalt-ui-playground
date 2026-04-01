export default {
  extends: ["stylelint-config-standard"],
  rules: {
    // Allow Blueprint class patterns (e.g. .bp5-button)
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
