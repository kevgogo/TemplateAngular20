/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],

  rules: {
    // Permite estos tipos (añade los tuyos si hace falta)
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "task",
        "bug", // <- añadidos
      ],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],

    // Mínimos "equilibrados" (no rompen commits útiles cortos)
    "subject-min-length": [2, "always", 4],
    "header-min-length": [2, "always", 8],

    // Buenas prácticas
    "header-max-length": [2, "always", 100],
    "body-leading-blank": [2, "always"],
    "body-max-line-length": [1, "always", 100],
    "footer-max-line-length": [1, "always", 100],

    // (Opcional) no exigir scope
    "scope-empty": [0],

    // ------- CUERPO OBLIGATORIO -------
    "body-empty": [2, "never"],
  },
  parserPreset: {
    parserOpts: {
      issuePrefixes: ["#", "refs:", "closes:", "fixes:", "resolves:"],
      referenceActions: [
        "close",
        "closes",
        "closed",
        "fix",
        "fixes",
        "fixed",
        "resolve",
        "resolves",
        "resolved",
        "refs",
        "references",
        "cierra",
        "resuelve",
        "arregla",
        "corrige",
      ],
    },
  },

  ignores: [
    (message) => message.includes("Merge branch"),
    (message) => message.includes("Merge pull request"),
    (message) => message.includes("Initial commit"),
    (message) => message.includes("WIP:"),
    (message) => message.includes("fixup!"),
    (message) => message.includes("squash!"),
  ],

  prompt: {
    questions: {
      type: {
        description: "Selecciona el tipo de cambio que estás committeando:",
        enum: {
          feat: {
            description: "🚀 Una nueva funcionalidad",
            title: "Features",
          },
          fix: {
            description: "🐛 Una corrección de bug",
            title: "Bug Fixes",
          },
          docs: {
            description: "📚 Solo cambios en documentación",
            title: "Documentation",
          },
          style: {
            description:
              "💎 Cambios que no afectan el significado del código (espacios, formato, etc)",
            title: "Styles",
          },
          refactor: {
            description:
              "📦 Un cambio de código que no corrige un bug ni añade una feature",
            title: "Code Refactoring",
          },
          perf: {
            description: "🚀 Un cambio de código que mejora el rendimiento",
            title: "Performance Improvements",
          },
          test: {
            description:
              "🚨 Añadir tests faltantes o corregir tests existentes",
            title: "Tests",
          },
          chore: {
            description:
              "🛠️ Cambios en el proceso de build o herramientas auxiliares",
            title: "Chores",
          },
          ci: {
            description: "⚙️ Cambios en archivos de configuración de CI",
            title: "Continuous Integrations",
          },
          build: {
            description:
              "📦 Cambios que afectan el sistema de build o dependencias externas",
            title: "Builds",
          },
        },
      },
      scope: {
        description:
          "¿Cuál es el SCOPE de este cambio (ej. componente o nombre de archivo):",
      },
      subject: {
        description: "Escribe una descripción CORTA e IMPERATIVA del cambio:\n",
      },
      body: {
        description:
          'Proporciona una descripción MÁS LARGA del cambio (opcional). Usa "|" para saltos de línea:\n',
      },
      isBreaking: {
        description: "¿Hay BREAKING CHANGES?",
      },
      breakingBody: {
        description:
          "Un commit BREAKING CHANGE requiere un cuerpo. Describe qué cambió:\n",
      },
      breaking: {
        description: "Describe los BREAKING CHANGES:\n",
      },
      isIssueAffected: {
        description: "¿Este cambio afecta algún issue abierto?",
      },
      issuesBody: {
        description:
          "Si hay issues cerrados, el commit requiere un cuerpo. Describe brevemente:\n",
      },
      issues: {
        description:
          'Añade referencias a issues (ej. "fix #123", "refs #123"):\n',
      },
    },
  },
};
