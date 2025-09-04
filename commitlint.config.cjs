// commitlint.config.cjs
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Tipos permitidos
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "task",
        "refactor",
        "docs",
        "style",
        "test",
        "build",
        "ci",
        "perf",
        "revert",
      ],
    ],

    // Tipo obligatorio, minúsculas
    "type-empty": [2, "never"],
    "type-case": [2, "always", "lower-case"],

    // Scope opcional; si lo usas, en lower/kebab
    "scope-case": [2, "always", ["lower-case", "kebab-case"]],

    // Subject
    "subject-empty": [0], // no exigimos subject
    "subject-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 120],

    // Body obligatorio y con mínimo
    "body-empty": [2, "never"],
    "body-min-length": [2, "always", 20],
    "body-leading-blank": [2, "always"], // línea en blanco entre header y body
    "footer-leading-blank": [2, "always"],

    // 🚫 Desactivar validación de longitud en body/footer
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
  },
};
