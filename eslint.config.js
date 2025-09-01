// @ts-check
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const prettierCompat = require("eslint-config-prettier/flat");

/** @type {import('eslint').Linter.Config[]} */
module.exports = tseslint.config(
  // Ignorados globales
  { ignores: ["dist/**", ".angular/**", "coverage/**", "**/*.min.*"] },

  /* 1) == CONFIG FILES SIN TIPOS ==
     Aplica a jest.config.ts y otros *.config.ts/.mts/.cts
     Usa el set "recommended" no tipado y desactiva projectService. */
  {
    files: [
      "**/*.config.ts",
      "**/*.config.mts",
      "**/*.config.cts",
      "jest.config.ts",
      "devextreme-license.ts",
      "devextreme.license.ts",
    ],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended, // NO tipado
    ],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },

  /* 2) == CÓDIGO ANGULAR TIPADO ==
     Excluye explícitamente los config para que no caigan aquí. */
  {
    files: ["**/*.ts"],
    ignores: [
      "**/*.config.ts",
      "**/*.config.mts",
      "**/*.config.cts",
      "jest.config.ts",
      "devextreme-license.ts",
      "devextreme.license.ts",
    ],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@angular-eslint/component-selector": [
        "error",
        { type: "element", prefix: "app", style: "kebab-case" },
      ],
      "@angular-eslint/directive-selector": [
        "error",
        { type: "attribute", prefix: "app", style: "camelCase" },
      ],
    },
  },

  // Templates .html
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended],
  },

  // Compat con Prettier
  prettierCompat,
);
