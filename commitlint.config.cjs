module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "feature",
        "fix",
        "bug",
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
    // Summary NO requerido (permitimos subject vacío)
    "subject-empty": [0],
    // Descripción requerida y mínimo 20 caracteres
    "body-empty": [2, "never"],
    "body-min-length": [2, "always", 20],
    // Sugerencias útiles
    "type-case": [2, "always", "lower-case"],
    "header-max-length": [2, "always", 120],
  },
};
