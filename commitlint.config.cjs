// commitlint.config.cjs
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // tipos permitidos (ajústalos si quieres)
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "revert",
        "task",
        "bug",
      ],
    ],
    // exige scope en kebab-case (puedes cambiar a 'always'/'never' según prefieras)
    "scope-case": [2, "always", "kebab-case"],
    "type-empty": [2, "never"],
    "scope-empty": [2, "never"],
    "subject-empty": [2, "never"],
    // largo del título y mínimo de texto del subject (me preguntaste “¿20?”)
    "header-max-length": [2, "always", 72],
    "subject-min-length": [2, "always", 20],
    // no forzamos mayúsculas/minúsculas del subject
    "subject-case": [0],
  },
};
